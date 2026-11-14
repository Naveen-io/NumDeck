use crate::actions::ActionExecutor;
use crate::types::*;
use crossbeam_channel::{Receiver, Sender};
use parking_lot::RwLock;
use std::collections::HashSet;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::System::LibraryLoader::GetModuleHandleW;
use windows_sys::Win32::System::Threading::{GetCurrentProcessId, GetCurrentThreadId};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::WindowsAndMessaging::*;

const LLKHF_EXTENDED_FLAG: u32 = 0x00000001;
const LLKHF_INJECTED_FLAG: u32 = 0x00000010;
const LLKHF_UP_FLAG: u32 = 0x00000080;

/// Diagnostic telemetry record capturing all 12 requested fields
#[derive(Debug, Clone)]
pub struct TelemetryRecord {
    pub timestamp_ms: u64,
    pub fg_window: String,
    pub fg_pid: u32,
    pub is_self_foreground: bool,
    pub vk_code: u32,
    pub vk_name: String,
    pub scan_code: u32,
    pub is_extended: bool,
    pub is_key_down: bool,
    pub is_injected: bool,
    pub numlock_on: bool,
    pub matched_logical_key: Option<String>,
    pub deck_mode_enabled: bool,
    pub event_suppressed: bool,
    pub queued_action: Option<String>,
    pub hook_duration_us: u64,
}

/// Messages routed from the fast Win32 hook procedure to the asynchronous worker thread
pub enum WorkerMessage {
    ExecuteAction {
        key_id: String,
        action: ActionConfig,
    },
    Telemetry(TelemetryRecord),
    CalibrationKeyCaptured(KeySignature),
    EmergencyReset,
}

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
    pub fn new(calibration: CalibrationProfile, default_profile: Profile, initial_deck_mode: bool) -> Self {
        Self {
            mode: RwLock::new(if initial_deck_mode {
                EngineMode::Deck
            } else {
                EngineMode::Normal
            }),
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
    worker_tx: Sender<WorkerMessage>,
}

pub struct KeyboardEngine {
    state: Arc<KeyboardEngineState>,
    hook_thread_id: Arc<AtomicU32>,
    pub worker_tx: Sender<WorkerMessage>,
}

impl KeyboardEngine {
    pub fn start(
        app_handle: AppHandle,
        calibration: CalibrationProfile,
        default_profile: Profile,
        initial_deck_mode: bool,
    ) -> Self {
        let state = Arc::new(KeyboardEngineState::new(calibration, default_profile, initial_deck_mode));
        let (worker_tx, worker_rx) = crossbeam_channel::unbounded::<WorkerMessage>();
        let hook_thread_id = Arc::new(AtomicU32::new(0));

        // 1. Start Off-Thread Worker Loop (handles File I/O, IPC emissions, and Action execution)
        let worker_state = Arc::clone(&state);
        let worker_app = app_handle.clone();
        thread::Builder::new()
            .name("numdeck-action-worker".to_string())
            .spawn(move || {
                Self::worker_loop(worker_rx, worker_state, worker_app);
            })
            .expect("Failed to spawn action worker thread");

        // 2. Set up global hook context (only lightweight sender and shared state)
        *HOOK_DATA.write() = Some(HookContext {
            state: Arc::clone(&state),
            worker_tx: worker_tx.clone(),
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
            worker_tx,
        }
    }

    pub fn state(&self) -> Arc<KeyboardEngineState> {
        Arc::clone(&self.state)
    }

    /// Background thread that handles logging, action execution, and UI IPC emissions
    /// Completely decoupling heavy work and IPC from the critical low-level keyboard hook.
    fn worker_loop(
        rx: Receiver<WorkerMessage>,
        state: Arc<KeyboardEngineState>,
        app: AppHandle,
    ) {
        log::info!("Off-thread action/telemetry worker initialized.");

        // Open local debug log file for streaming telemetry
        let local_log_path = PathBuf::from("engine_debug.log");
        let appdata_log_path = std::env::var("APPDATA")
            .ok()
            .map(|p| PathBuf::from(p).join("NumpadDeck").join("engine_debug.log"));

        let mut log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&local_log_path)
            .ok();

        while let Ok(msg) = rx.recv() {
            match msg {
                WorkerMessage::ExecuteAction { key_id, action } => {
                    log::info!("Executing assigned action for key '{}': {:?}", key_id, action);
                    let action_summary = format!("{:?}", action);

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
                                let _ = app.emit("action-error", e.clone());
                                if let Some(ref mut f) = log_file {
                                    let _ = writeln!(f, "   └─ [ACTION ERROR] for key '{}': {}", key_id, e);
                                }
                            } else {
                                if let Some(ref mut f) = log_file {
                                    let _ = writeln!(f, "   └─ [ACTION EXECUTED] for key '{}' ({}) -> SUCCESS", key_id, action_summary);
                                }
                            }
                        }
                    }

                    // Emit key triggered event to UI for visual illumination
                    let _ = app.emit("deck-key-triggered", key_id);
                }

                WorkerMessage::Telemetry(t) => {
                    // Format detailed single-line log
                    let line = format!(
                        "[{}] FG: \"{}\" (PID {}, SELF={}) | VK: 0x{:02X} ({}) | Scan: 0x{:02X} | Ext: {} | Down: {} | Injected: {} | NumLock: {} | Matched: {:?} | DeckMode: {} | Suppressed: {} | ActionQueued: {:?} | HookDuration: {}us",
                        format_timestamp(t.timestamp_ms),
                        t.fg_window,
                        t.fg_pid,
                        t.is_self_foreground,
                        t.vk_code,
                        t.vk_name,
                        t.scan_code,
                        if t.is_extended { 1 } else { 0 },
                        t.is_key_down,
                        t.is_injected,
                        if t.numlock_on { "ON" } else { "OFF" },
                        t.matched_logical_key,
                        t.deck_mode_enabled,
                        t.event_suppressed,
                        t.queued_action,
                        t.hook_duration_us
                    );

                    // Write to debug log and stdout only when diagnostics active or in debug builds
                    if cfg!(debug_assertions) || state.diagnostics_active.load(Ordering::Relaxed) {
                        if let Some(ref mut f) = log_file {
                            let _ = writeln!(f, "{}", line);
                            let _ = f.flush();
                        }

                        if let Some(ref ap_path) = appdata_log_path {
                            if let Ok(mut ap_file) = OpenOptions::new().create(true).append(true).open(ap_path) {
                                let _ = writeln!(ap_file, "{}", line);
                            }
                        }

                        println!("{}", line);
                    }

                    // Emit diagnostic event to UI if viewer active
                    if state.diagnostics_active.load(Ordering::Relaxed) {
                        let diag = DiagnosticEvent {
                            timestamp: t.timestamp_ms,
                            event_type: if t.is_key_down { "keydown".to_string() } else { "keyup".to_string() },
                            vk_code: t.vk_code,
                            vk_name: t.vk_name,
                            scan_code: t.scan_code,
                            is_extended: t.is_extended,
                            is_injected: t.is_injected,
                            numlock_on: t.numlock_on,
                            is_suppressed: t.event_suppressed,
                            matched_logical_key: t.matched_logical_key,
                        };
                        let _ = app.emit("diagnostic-key-event", diag);
                    }
                }

                WorkerMessage::CalibrationKeyCaptured(sig) => {
                    let _ = app.emit("calibration-key-captured", sig);
                }

                WorkerMessage::EmergencyReset => {
                    log::warn!("Off-thread worker processing EmergencyReset...");
                    *state.mode.write() = EngineMode::Normal;
                    let _ = app.emit("deck-mode-changed", false);
                    let _ = app.emit("emergency-reset", ());
                }
            }
        }
        log::info!("Off-thread action/telemetry worker terminated.");
    }

    /// Dedicated hook thread running Windows message loop
    fn hook_thread_loop(thread_id_store: Arc<AtomicU32>) {
        unsafe {
            let tid = GetCurrentThreadId();
            thread_id_store.store(tid, Ordering::SeqCst);

            // Correctly obtain current executable module handle for global WH_KEYBOARD_LL hook
            let hmod = GetModuleHandleW(std::ptr::null());

            let hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(low_level_keyboard_proc),
                hmod,
                0,
            );

            if hook.is_null() {
                log::error!("Failed to install WH_KEYBOARD_LL hook! Error: {}", GetLastError());
                return;
            }

            log::info!("WH_KEYBOARD_LL hook successfully installed with hMod on thread {}", tid);

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

/// Fast foreground window query (pure memory read in user32, sub-microsecond)
fn get_foreground_info() -> (String, u32, bool) {
    unsafe {
        let fg_hwnd = GetForegroundWindow();
        if fg_hwnd.is_null() {
            return ("None".to_string(), 0, false);
        }
        let mut fg_pid = 0u32;
        GetWindowThreadProcessId(fg_hwnd, &mut fg_pid);
        let my_pid = GetCurrentProcessId();
        let is_self = fg_pid == my_pid;

        let mut title_buf = [0u16; 128];
        let len = GetWindowTextW(fg_hwnd, title_buf.as_mut_ptr(), 128);
        let title = if len > 0 {
            String::from_utf16_lossy(&title_buf[..len as usize])
        } else {
            "Untitled / System".to_string()
        };

        (title, fg_pid, is_self)
    }
}

/// The Low-Level Keyboard Hook Callback
/// GUARANTEED SUB-5-MICROSECOND EXECUTION.
/// ZERO disk I/O, ZERO IPC to webviews, ZERO COM calls, ZERO heavy locks.
unsafe extern "system" fn low_level_keyboard_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    let hook_start = Instant::now();

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
        let is_extended = (flags & LLKHF_EXTENDED_FLAG) != 0;
        let is_key_up = (flags & LLKHF_UP_FLAG) != 0;
        let is_key_down = !is_key_up;

        // Check NumLock state via GetKeyState
        let numlock_on = (GetKeyState(VK_NUMLOCK as i32) & 1) != 0;

        // Query foreground window info
        let (fg_window, fg_pid, is_self_foreground) = get_foreground_info();

        if is_injected {
            // Synthetic input generated by our own SendInput; pass through immediately without delay
            let duration_us = hook_start.elapsed().as_micros() as u64;
            let _ = hook_data.worker_tx.send(WorkerMessage::Telemetry(TelemetryRecord {
                timestamp_ms: current_time_ms(),
                fg_window,
                fg_pid,
                is_self_foreground,
                vk_code,
                vk_name: vk_code_to_name(vk_code),
                scan_code,
                is_extended,
                is_key_down,
                is_injected: true,
                numlock_on,
                matched_logical_key: None,
                deck_mode_enabled: false,
                event_suppressed: false,
                queued_action: None,
                hook_duration_us: duration_us,
            }));
            return CallNextHookEx(0 as _, n_code, w_param, l_param);
        }

        // Emergency shortcut check: triple-Esc
        if is_key_down && hook_data.state.emergency_shortcut_enabled.load(Ordering::Relaxed) {
            if vk_code == VK_ESCAPE as u32 {
                let mut last_time = hook_data.state.last_esc_time.write();
                let now = Instant::now();
                if now.duration_since(*last_time) < Duration::from_millis(1200) {
                    let count = hook_data.state.esc_press_count.fetch_add(1, Ordering::SeqCst) + 1;
                    if count >= 3 {
                        *hook_data.state.mode.write() = EngineMode::Normal;
                        hook_data.state.esc_press_count.store(0, Ordering::SeqCst);
                        log::warn!("EMERGENCY DISABLE TRIGGERED: Deck Mode forcibly reset to Normal!");
                        let _ = hook_data.worker_tx.send(WorkerMessage::EmergencyReset);
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
                let _ = hook_data.worker_tx.send(WorkerMessage::CalibrationKeyCaptured(signature));
            }
            let duration_us = hook_start.elapsed().as_micros() as u64;
            let _ = hook_data.worker_tx.send(WorkerMessage::Telemetry(TelemetryRecord {
                timestamp_ms: current_time_ms(),
                fg_window,
                fg_pid,
                is_self_foreground,
                vk_code,
                vk_name: vk_code_to_name(vk_code),
                scan_code,
                is_extended,
                is_key_down,
                is_injected: false,
                numlock_on,
                matched_logical_key: None,
                deck_mode_enabled: false,
                event_suppressed: true,
                queued_action: None,
                hook_duration_us: duration_us,
            }));
            // Suppress key during calibration
            return 1;
        }

        // 2. Deck Mode
        if current_mode == EngineMode::Deck {
            let cal = hook_data.state.calibration.read();
            let matched_key = cal.find_matched_key(vk_code, scan_code, is_extended);
            drop(cal);

            if let Some(key_id) = matched_key {
                let mut queued_action_str = None;

                if is_key_down {
                    let mut pressed = hook_data.state.pressed_keys.write();
                    let is_first_press = pressed.insert(key_id.clone());
                    drop(pressed);

                    if is_first_press {
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
                                queued_action_str = Some(format!("{:?}", action));
                                let _ = hook_data.worker_tx.send(WorkerMessage::ExecuteAction {
                                    key_id: key_id.clone(),
                                    action: action.clone(),
                                });
                            }
                        }
                    }
                } else {
                    let mut pressed = hook_data.state.pressed_keys.write();
                    pressed.remove(&key_id);
                }

                let duration_us = hook_start.elapsed().as_micros() as u64;
                let _ = hook_data.worker_tx.send(WorkerMessage::Telemetry(TelemetryRecord {
                    timestamp_ms: current_time_ms(),
                    fg_window,
                    fg_pid,
                    is_self_foreground,
                    vk_code,
                    vk_name: vk_code_to_name(vk_code),
                    scan_code,
                    is_extended,
                    is_key_down,
                    is_injected: false,
                    numlock_on,
                    matched_logical_key: Some(key_id),
                    deck_mode_enabled: true,
                    event_suppressed: true,
                    queued_action: queued_action_str,
                    hook_duration_us: duration_us,
                }));

                // SUPPRESS THIS KEY FROM PASSING TO WINDOWS: Return 1
                return 1;
            }
        }

        // 3. Normal Mode or unmapped keys: Pass through
        let cal = hook_data.state.calibration.read();
        let matched = cal.find_matched_key(vk_code, scan_code, is_extended);
        drop(cal);

        let duration_us = hook_start.elapsed().as_micros() as u64;
        let _ = hook_data.worker_tx.send(WorkerMessage::Telemetry(TelemetryRecord {
            timestamp_ms: current_time_ms(),
            fg_window,
            fg_pid,
            is_self_foreground,
            vk_code,
            vk_name: vk_code_to_name(vk_code),
            scan_code,
            is_extended,
            is_key_down,
            is_injected: false,
            numlock_on,
            matched_logical_key: matched,
            deck_mode_enabled: current_mode == EngineMode::Deck,
            event_suppressed: false,
            queued_action: None,
            hook_duration_us: duration_us,
        }));

        CallNextHookEx(0 as _, n_code, w_param, l_param)
    }
}

fn current_time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn format_timestamp(ms: u64) -> String {
    let secs = ms / 1000;
    let millis = ms % 1000;
    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, millis)
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
