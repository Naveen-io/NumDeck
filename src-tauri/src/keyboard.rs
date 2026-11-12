use crate::actions::ActionExecutor;
use crate::types::*;
use crossbeam_channel::{Receiver, Sender};
use parking_lot::RwLock;
use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::System::Threading::GetCurrentThreadId;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::WindowsAndMessaging::*;

const LLKHF_EXTENDED_FLAG: u32 = 0x00000001;
const LLKHF_INJECTED_FLAG: u32 = 0x00000010;
const LLKHF_UP_FLAG: u32 = 0x00000080;

/// State shared between Tauri commands, Low-Level Hook, and Action Executor
pub struct KeyboardEngineState {
    pub mode: RwLock<EngineMode>,
    pub calibration: RwLock<CalibrationProfile>,
    pub active_profile: RwLock<Profile>,
    pub active_folder_id: RwLock<Option<String>>,
    pub pressed_keys: RwLock<HashSet<String>>,
    pub emergency_shortcut_enabled: AtomicBool,
    pub sound_feedback: AtomicBool,
    pub esc_press_count: AtomicU32,
    pub last_esc_time: RwLock<Instant>,
    pub diagnostics_active: AtomicBool,
}

impl KeyboardEngineState {
    pub fn new(calibration: CalibrationProfile, default_profile: Profile) -> Self {
        Self {
            mode: RwLock::new(EngineMode::Normal),
            calibration: RwLock::new(calibration),
            active_profile: RwLock::new(default_profile),
            active_folder_id: RwLock::new(None),
            pressed_keys: RwLock::new(HashSet::new()),
            emergency_shortcut_enabled: AtomicBool::new(true),
            sound_feedback: AtomicBool::new(true),
            esc_press_count: AtomicU32::new(0),
            last_esc_time: RwLock::new(Instant::now()),
            diagnostics_active: AtomicBool::new(true),
        }
    }
}

// Global static holder for hook context accessed by the Win32 C-callback
static HOOK_DATA: parking_lot::RwLock<Option<HookContext>> = parking_lot::RwLock::new(None);

struct HookContext {
    state: Arc<KeyboardEngineState>,
    action_tx: Sender<ActionConfig>,
    app_handle: AppHandle,
}

pub struct KeyboardEngine {
    state: Arc<KeyboardEngineState>,
    hook_thread_id: Arc<AtomicU32>,
    pub action_tx: Sender<ActionConfig>,
}

impl KeyboardEngine {
    pub fn start(
        app_handle: AppHandle,
        calibration: CalibrationProfile,
        default_profile: Profile,
    ) -> Self {
        let state = Arc::new(KeyboardEngineState::new(calibration, default_profile));
        let (action_tx, action_rx) = crossbeam_channel::unbounded::<ActionConfig>();
        let hook_thread_id = Arc::new(AtomicU32::new(0));

        // 1. Start Action Execution Worker Thread
        let action_state = Arc::clone(&state);
        let action_app = app_handle.clone();
        thread::Builder::new()
            .name("numdeck-action-worker".to_string())
            .spawn(move || {
                Self::action_worker_loop(action_rx, action_state, action_app);
            })
            .expect("Failed to spawn action worker thread");

        // 2. Set up global hook context
        *HOOK_DATA.write() = Some(HookContext {
            state: Arc::clone(&state),
            action_tx: action_tx.clone(),
            app_handle: app_handle.clone(),
        });

        // 3. Start Dedicated Win32 Keyboard Hook Thread with Message Pump
        let thread_id_clone = Arc::clone(&hook_thread_id);
        thread::Builder::new()
            .name("numdeck-hook-thread".to_string())
            .spawn(move || {
                Self::hook_thread_loop(thread_id_clone);
            })
            .expect("Failed to spawn hook thread");

        Self {
            state,
            hook_thread_id,
            action_tx,
        }
    }

    pub fn state(&self) -> Arc<KeyboardEngineState> {
        Arc::clone(&self.state)
    }

    /// Background thread that processes actions outside the low-level hook
    fn action_worker_loop(
        rx: Receiver<ActionConfig>,
        state: Arc<KeyboardEngineState>,
        app: AppHandle,
    ) {
        log::info!("Action worker thread initialized.");
        while let Ok(action) = rx.recv() {
            match action {
                ActionConfig::ToggleDeckMode => {
                    let mut mode_guard = state.mode.write();
                    let new_mode = match *mode_guard {
                        EngineMode::Deck => EngineMode::Normal,
                        _ => EngineMode::Deck,
                    };
                    *mode_guard = new_mode;
                    drop(mode_guard);

                    let is_deck = new_mode == EngineMode::Deck;
                    log::info!("Deck mode toggled via action to: {:?}", new_mode);
                    let _ = app.emit("deck-mode-changed", is_deck);
                }
                ActionConfig::SwitchProfile { profile_id } => {
                    log::info!("Switching profile to: {}", profile_id);
                    let _ = app.emit("request-switch-profile", profile_id);
                }
                ActionConfig::NavigateFolder { folder_id } => {
                    *state.active_folder_id.write() = Some(folder_id.clone());
                    let _ = app.emit("folder-changed", Some(folder_id));
                }
                ActionConfig::BackToRootFolder => {
                    *state.active_folder_id.write() = None;
                    let _ = app.emit("folder-changed", None::<String>);
                }
                other => {
                    if let Err(e) = ActionExecutor::execute(other) {
                        log::error!("Action execution failed: {}", e);
                        let _ = app.emit("action-error", e);
                    }
                }
            }
        }
        log::info!("Action worker thread terminated.");
    }

    /// Dedicated hook thread running Windows message loop
    fn hook_thread_loop(thread_id_store: Arc<AtomicU32>) {
        unsafe {
            let tid = GetCurrentThreadId();
            thread_id_store.store(tid, Ordering::SeqCst);

            let hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(low_level_keyboard_proc),
                0 as _,
                0,
            );

            if hook.is_null() {
                log::error!("Failed to install WH_KEYBOARD_LL hook!");
                return;
            }

            log::info!("WH_KEYBOARD_LL hook successfully installed on thread {}", tid);

            let mut msg: MSG = std::mem::zeroed();
            while GetMessageW(&mut msg, 0 as _, 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            log::info!("Unhooking WH_KEYBOARD_LL...");
            UnhookWindowsHookEx(hook);
            log::info!("WH_KEYBOARD_LL cleanly unhooked.");
        }
    }

    /// Graceful shutdown
    pub fn shutdown(&self) {
        let tid = self.hook_thread_id.load(Ordering::SeqCst);
        if tid != 0 {
            unsafe {
                PostThreadMessageW(tid, WM_QUIT, 0, 0);
            }
        }
    }
}

impl Drop for KeyboardEngine {
    fn drop(&mut self) {
        self.shutdown();
    }
}

/// The Low-Level Keyboard Hook Callback
/// This must remain EXTREMELY FAST (under 1ms). No disk I/O, no process launching here.
unsafe extern "system" fn low_level_keyboard_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    unsafe {
        if n_code < 0 {
            return CallNextHookEx(0 as _, n_code, w_param, l_param);
        }

        let hook_guard = HOOK_DATA.read();
        let hook_data = match hook_guard.as_ref() {
            Some(data) => data,
            None => return CallNextHookEx(0 as _, n_code, w_param, l_param),
        };

        let kbd = *(l_param as *const KBDLLHOOKSTRUCT);
        let vk_code = kbd.vkCode;
        let scan_code = kbd.scanCode;
        let flags = kbd.flags;

        // Check injected flag: ALWAYS ignore synthetic input generated by SendInput
        let is_injected = (flags & LLKHF_INJECTED_FLAG) != 0;
        if is_injected {
            return CallNextHookEx(0 as _, n_code, w_param, l_param);
        }

        let is_extended = (flags & LLKHF_EXTENDED_FLAG) != 0;
        let is_key_up = (flags & LLKHF_UP_FLAG) != 0;
        let is_key_down = !is_key_up;

        // Check NumLock state via GetKeyState
        let numlock_on = (GetKeyState(VK_NUMLOCK as i32) & 1) != 0;

        // Emergency shortcut check: triple-Esc or Ctrl+Shift+Esc
        if is_key_down && hook_data.state.emergency_shortcut_enabled.load(Ordering::Relaxed) {
            if vk_code == VK_ESCAPE as u32 {
                let mut last_time = hook_data.state.last_esc_time.write();
                let now = Instant::now();
                if now.duration_since(*last_time) < Duration::from_millis(1200) {
                    let count = hook_data.state.esc_press_count.fetch_add(1, Ordering::SeqCst) + 1;
                    if count >= 3 {
                        // Emergency trigger!
                        *hook_data.state.mode.write() = EngineMode::Normal;
                        hook_data.state.esc_press_count.store(0, Ordering::SeqCst);
                        log::warn!("EMERGENCY DISABLE TRIGGERED: Deck Mode forcibly reset to Normal!");
                        let _ = hook_data.app_handle.emit("emergency-reset", ());
                        let _ = hook_data.app_handle.emit("deck-mode-changed", false);
                    }
                } else {
                    hook_data.state.esc_press_count.store(1, Ordering::SeqCst);
                }
                *last_time = now;
            }
        }

        let current_mode = *hook_data.state.mode.read();

        // 1. Calibrating Mode
        if current_mode == EngineMode::Calibrating {
            if is_key_down {
                let signature = KeySignature::new(vk_code, scan_code, is_extended);
                let _ = hook_data.app_handle.emit("calibration-key-captured", signature);
            }
            // Emit diagnostic
            emit_diagnostic(hook_data, vk_code, scan_code, is_extended, is_injected, numlock_on, is_key_down, true, None);
            // Suppress key during calibration so it doesn't type into other apps
            return 1;
        }

        // 2. Deck Mode
        if current_mode == EngineMode::Deck {
            let cal = hook_data.state.calibration.read();
            let matched_key = cal.find_matched_key(vk_code, scan_code, is_extended);
            drop(cal);

            if let Some(key_id) = matched_key {
                // Found a configured numpad key!
                if is_key_down {
                    let mut pressed = hook_data.state.pressed_keys.write();
                    let is_first_press = pressed.insert(key_id.clone());
                    drop(pressed);

                    if is_first_press {
                        // Look up action in active folder or active profile
                        let profile = hook_data.state.active_profile.read();
                        let active_folder = hook_data.state.active_folder_id.read();

                        let assignment = if let Some(folder_id) = active_folder.as_ref() {
                            profile
                                .folders
                                .iter()
                                .find(|f| f.id == *folder_id)
                                .and_then(|f| f.keys.get(&key_id))
                                .or_else(|| profile.keys.get(&key_id))
                        } else {
                            profile.keys.get(&key_id)
                        };

                        if let Some(assign) = assignment {
                            if let Some(action) = &assign.action {
                                // Queue action for execution outside the hook
                                let _ = hook_data.action_tx.send(action.clone());
                            }
                        }

                        // Emit key triggered event to UI for visual feedback
                        let _ = hook_data.app_handle.emit("deck-key-triggered", key_id.clone());
                    }
                } else {
                    // Key Up: release from pressed tracking
                    let mut pressed = hook_data.state.pressed_keys.write();
                    pressed.remove(&key_id);
                }

                // Emit diagnostic
                emit_diagnostic(hook_data, vk_code, scan_code, is_extended, is_injected, numlock_on, is_key_down, true, Some(key_id));

                // SUPPRESS THIS KEY: Return 1
                return 1;
            }
        }

        // 3. Normal Mode or unmapped keys
        if hook_data.state.diagnostics_active.load(Ordering::Relaxed) {
            let cal = hook_data.state.calibration.read();
            let matched = cal.find_matched_key(vk_code, scan_code, is_extended);
            drop(cal);
            emit_diagnostic(hook_data, vk_code, scan_code, is_extended, is_injected, numlock_on, is_key_down, false, matched);
        }

        // Pass through to next hook
        CallNextHookEx(0 as _, n_code, w_param, l_param)
    }
}

fn emit_diagnostic(
    hook_data: &HookContext,
    vk_code: u32,
    scan_code: u32,
    is_extended: bool,
    is_injected: bool,
    numlock_on: bool,
    is_key_down: bool,
    is_suppressed: bool,
    matched_logical_key: Option<String>,
) {
    if !hook_data.state.diagnostics_active.load(Ordering::Relaxed) {
        return;
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let vk_name = vk_code_to_name(vk_code);

    let event = DiagnosticEvent {
        timestamp,
        event_type: if is_key_down { "keydown".to_string() } else { "keyup".to_string() },
        vk_code,
        vk_name,
        scan_code,
        is_extended,
        is_injected,
        numlock_on,
        is_suppressed,
        matched_logical_key,
    };

    let _ = hook_data.app_handle.emit("diagnostic-key-event", event);
}

pub fn vk_code_to_name(vk: u32) -> String {
    match vk as u16 {
        VK_NUMPAD0 => "NUMPAD 0".to_string(),
        VK_NUMPAD1 => "NUMPAD 1".to_string(),
        VK_NUMPAD2 => "NUMPAD 2".to_string(),
        VK_NUMPAD3 => "NUMPAD 3".to_string(),
        VK_NUMPAD4 => "NUMPAD 4".to_string(),
        VK_NUMPAD5 => "NUMPAD 5".to_string(),
        VK_NUMPAD6 => "NUMPAD 6".to_string(),
        VK_NUMPAD7 => "NUMPAD 7".to_string(),
        VK_NUMPAD8 => "NUMPAD 8".to_string(),
        VK_NUMPAD9 => "NUMPAD 9".to_string(),
        VK_MULTIPLY => "NUMPAD *".to_string(),
        VK_ADD => "NUMPAD +".to_string(),
        VK_SUBTRACT => "NUMPAD -".to_string(),
        VK_DECIMAL => "NUMPAD .".to_string(),
        VK_DIVIDE => "NUMPAD /".to_string(),
        VK_NUMLOCK => "NUM LOCK".to_string(),
        VK_RETURN => "ENTER".to_string(),
        VK_HOME => "HOME".to_string(),
        VK_UP => "UP ARROW".to_string(),
        VK_PRIOR => "PAGE UP".to_string(),
        VK_LEFT => "LEFT ARROW".to_string(),
        VK_CLEAR => "CLEAR".to_string(),
        VK_RIGHT => "RIGHT ARROW".to_string(),
        VK_END => "END".to_string(),
        VK_DOWN => "DOWN ARROW".to_string(),
        VK_NEXT => "PAGE DOWN".to_string(),
        VK_INSERT => "INSERT".to_string(),
        VK_DELETE => "DELETE".to_string(),
        VK_ESCAPE => "ESCAPE".to_string(),
        VK_TAB => "TAB".to_string(),
        VK_SPACE => "SPACE".to_string(),
        VK_BACK => "BACKSPACE".to_string(),
        0x30..=0x39 => format!("KEY {}", (vk as u8 as char)),
        0x41..=0x5A => format!("KEY {}", (vk as u8 as char)),
        VK_F1..=VK_F12 => format!("F{}", vk - (VK_F1 as u32) + 1),
        _ => format!("0x{:02X}", vk),
    }
}
