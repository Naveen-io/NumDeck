use crate::actions::SYNTHETIC_EXTRA_INFO;
use crate::types::*;
use parking_lot::Mutex;
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, AtomicIsize, AtomicU32, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use windows::Win32::Foundation::*;
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::WindowsAndMessaging::*;

static HOOK_HANDLE: AtomicIsize = AtomicIsize::new(0);
static HOOK_THREAD_ID: AtomicU32 = AtomicU32::new(0);
static DECK_ACTIVE: AtomicBool = AtomicBool::new(true);
static TEST_MODE: AtomicBool = AtomicBool::new(true); // Default true so diagnostics receives live input immediately
static COMPACT_LAPTOP_MODE: AtomicBool = AtomicBool::new(false);

static DOWN_KEYS: Mutex<Option<HashSet<NumpadKey>>> = Mutex::new(None);
static GLOBAL_APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
static ON_KEY_TRIGGER: Mutex<Option<Arc<dyn Fn(NumpadKey) + Send + Sync>>> = Mutex::new(None);
static HOTKEY_CONFIG: Mutex<Option<HotkeyConfig>> = Mutex::new(None);
static CUSTOM_MAPPINGS: Mutex<Option<HashMap<String, NumpadKey>>> = Mutex::new(None);

pub struct KeyboardEngine;

impl KeyboardEngine {
    pub fn init<F>(
        app: AppHandle,
        is_active: bool,
        hotkey: HotkeyConfig,
        compact_mode: bool,
        custom_mappings: HashMap<String, NumpadKey>,
        on_key: F,
    ) where
        F: Fn(NumpadKey) + Send + Sync + 'static,
    {
        DECK_ACTIVE.store(is_active, Ordering::SeqCst);
        COMPACT_LAPTOP_MODE.store(compact_mode, Ordering::SeqCst);
        TEST_MODE.store(true, Ordering::SeqCst);
        *DOWN_KEYS.lock() = Some(HashSet::new());
        *HOTKEY_CONFIG.lock() = Some(hotkey);
        *CUSTOM_MAPPINGS.lock() = Some(custom_mappings);
        *GLOBAL_APP_HANDLE.lock() = Some(app);
        *ON_KEY_TRIGGER.lock() = Some(Arc::new(on_key));

        std::thread::Builder::new()
            .name("numpad-deck-hook-thread".into())
            .spawn(move || {
                Self::hook_thread_loop();
            })
            .expect("Failed to spawn keyboard hook thread");
    }

    pub fn set_deck_active(active: bool) {
        DECK_ACTIVE.store(active, Ordering::SeqCst);
        if let Some(keys) = DOWN_KEYS.lock().as_mut() {
            keys.clear();
        }
        if let Some(app) = GLOBAL_APP_HANDLE.lock().as_ref() {
            let _ = app.emit("deck-mode-changed", active);
        }
    }

    pub fn is_deck_active() -> bool {
        DECK_ACTIVE.load(Ordering::SeqCst)
    }

    pub fn toggle_deck_active() -> bool {
        let new_state = !Self::is_deck_active();
        Self::set_deck_active(new_state);
        new_state
    }

    pub fn set_test_mode(enabled: bool) {
        TEST_MODE.store(enabled, Ordering::SeqCst);
    }

    pub fn is_test_mode() -> bool {
        TEST_MODE.load(Ordering::SeqCst)
    }

    pub fn set_compact_mode(enabled: bool) {
        COMPACT_LAPTOP_MODE.store(enabled, Ordering::SeqCst);
    }

    pub fn update_hotkey(hotkey: HotkeyConfig) {
        *HOTKEY_CONFIG.lock() = Some(hotkey);
    }

    pub fn set_custom_mappings(mappings: HashMap<String, NumpadKey>) {
        *CUSTOM_MAPPINGS.lock() = Some(mappings);
    }

    pub fn add_custom_mapping(signature: String, key: NumpadKey) {
        let mut guard = CUSTOM_MAPPINGS.lock();
        if let Some(map) = guard.as_mut() {
            map.insert(signature, key);
        } else {
            let mut map = HashMap::new();
            map.insert(signature, key);
            *guard = Some(map);
        }
    }

    pub fn remove_custom_mapping(signature: &str) {
        if let Some(map) = CUSTOM_MAPPINGS.lock().as_mut() {
            map.remove(signature);
        }
    }

    pub fn get_custom_mappings() -> HashMap<String, NumpadKey> {
        CUSTOM_MAPPINGS.lock().clone().unwrap_or_default()
    }

    pub fn toggle_numlock() -> bool {
        unsafe {
            let inputs = [
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_NUMLOCK,
                            wScan: 0x45,
                            dwFlags: KEYBD_EVENT_FLAGS(0),
                            time: 0,
                            dwExtraInfo: SYNTHETIC_EXTRA_INFO,
                        },
                    },
                },
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_NUMLOCK,
                            wScan: 0x45,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: SYNTHETIC_EXTRA_INFO,
                        },
                    },
                },
            ];
            SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
            (GetKeyState(VK_NUMLOCK.0 as i32) & 0x0001) != 0
        }
    }

    pub fn shutdown() {
        let tid = HOOK_THREAD_ID.load(Ordering::SeqCst);
        if tid != 0 {
            unsafe {
                let _ = PostThreadMessageW(tid, WM_QUIT, WPARAM(0), LPARAM(0));
            }
        }
        let hook_val = HOOK_HANDLE.swap(0, Ordering::SeqCst);
        if hook_val != 0 {
            unsafe {
                let _ = UnhookWindowsHookEx(HHOOK(hook_val as *mut std::ffi::c_void));
            }
        }
        if let Some(keys) = DOWN_KEYS.lock().as_mut() {
            keys.clear();
        }
    }

    fn hook_thread_loop() {
        unsafe {
            let tid = GetCurrentThreadId();
            HOOK_THREAD_ID.store(tid, Ordering::SeqCst);

            let hinst = GetModuleHandleW(None).unwrap_or_default();
            let hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(Self::low_level_keyboard_proc),
                HINSTANCE(hinst.0),
                0,
            );

            match hook {
                Ok(h) => {
                    HOOK_HANDLE.store(h.0 as isize, Ordering::SeqCst);
                    println!("[KeyboardEngine] WH_KEYBOARD_LL hook installed successfully");

                    let mut msg = MSG::default();
                    while GetMessageW(&mut msg, HWND::default(), 0, 0).into() {
                        let _ = TranslateMessage(&msg);
                        DispatchMessageW(&msg);
                    }

                    println!("[KeyboardEngine] Message loop ended, cleaning up hook");
                    let _ = UnhookWindowsHookEx(h);
                    HOOK_HANDLE.store(0, Ordering::SeqCst);
                }
                Err(err) => {
                    eprintln!("[KeyboardEngine] Failed to install WH_KEYBOARD_LL hook: {err}");
                }
            }
        }
    }

    unsafe extern "system" fn low_level_keyboard_proc(
        code: i32,
        wparam: WPARAM,
        lparam: LPARAM,
    ) -> LRESULT {
        if code < 0 {
            return unsafe { CallNextHookEx(None, code, wparam, lparam) };
        }

        let kbd = unsafe { *(lparam.0 as *const KBDLLHOOKSTRUCT) };

        // Ignore synthetic input generated by Numpad Deck
        if kbd.dwExtraInfo == SYNTHETIC_EXTRA_INFO {
            return unsafe { CallNextHookEx(None, code, wparam, lparam) };
        }

        let is_key_down = wparam.0 == WM_KEYDOWN as usize || wparam.0 == WM_SYSKEYDOWN as usize;
        let is_key_up = wparam.0 == WM_KEYUP as usize || wparam.0 == WM_SYSKEYUP as usize;

        // Check for activation shortcut toggle (e.g. Ctrl + Alt + F12)
        if is_key_down && Self::is_activation_hotkey_pressed(&kbd) {
            let new_active = Self::toggle_deck_active();
            println!("[KeyboardEngine] Deck mode toggled via hotkey: {new_active}");
            return LRESULT(1); // Suppress hotkey key event
        }

        // Check for emergency exit shortcut (Ctrl + Alt + Shift + Escape)
        if is_key_down && Self::is_emergency_hotkey_pressed(&kbd) {
            println!("[KeyboardEngine] Emergency exit shortcut triggered! Deactivating deck.");
            Self::set_deck_active(false);
            return LRESULT(1);
        }

        let numlock_on = unsafe { (GetKeyState(VK_NUMLOCK.0 as i32) & 0x0001) != 0 };
        let is_extended = (kbd.flags.0 & LLKHF_EXTENDED.0) != 0;
        let scan_byte = (kbd.scanCode & 0xFF) as u8;
        let vk_name = vk_to_name(kbd.vkCode).to_string();

        let maybe_numpad_key = Self::identify_numpad_key(&kbd);
        let key_name = match maybe_numpad_key {
            Some(k) => k.display_name().to_string(),
            None => format!("Unassigned (0x{:X})", kbd.vkCode),
        };

        let now = format_time_now();

        // 1. Diagnostics event stream: Broadcast raw event for live UI inspection
        if TEST_MODE.load(Ordering::SeqCst) {
            if let Some(app) = GLOBAL_APP_HANDLE.lock().as_ref() {
                let raw_event = RawKeyEvent {
                    vk: kbd.vkCode,
                    vk_name: vk_name.clone(),
                    scan: kbd.scanCode,
                    scan_byte,
                    is_extended,
                    is_down: is_key_down,
                    numlock_on,
                    mapped_key: maybe_numpad_key,
                    key_name: key_name.clone(),
                    device_name: Some("Integrated Laptop / Windows Keyboard".to_string()),
                    timestamp: now.clone(),
                };
                let _ = app.emit("deck-raw-key", raw_event);
            }
        }

        // 2. Handling of detected Numpad Keys
        if let Some(numpad_key) = maybe_numpad_key {
            if TEST_MODE.load(Ordering::SeqCst) {
                if let Some(app) = GLOBAL_APP_HANDLE.lock().as_ref() {
                    let _ = app.emit(
                        "deck-key-test",
                        serde_json::json!({
                            "key": numpad_key,
                            "down": is_key_down,
                            "vk": kbd.vkCode,
                            "scan": kbd.scanCode,
                            "is_extended": is_extended,
                            "numlock_on": numlock_on,
                            "timestamp": now,
                        }),
                    );
                }
            }

            let is_active = DECK_ACTIVE.load(Ordering::SeqCst);

            if is_active {
                if is_key_down {
                    let mut guard = DOWN_KEYS.lock();
                    let already_down = if let Some(down_keys) = guard.as_mut() {
                        if down_keys.contains(&numpad_key) {
                            true
                        } else {
                            down_keys.insert(numpad_key);
                            false
                        }
                    } else {
                        false
                    };
                    drop(guard);

                    if !already_down {
                        // Trigger action callback
                        if let Some(callback) = ON_KEY_TRIGGER.lock().as_ref() {
                            callback(numpad_key);
                        }

                        // Emit to frontend for UI feedback
                        if let Some(app) = GLOBAL_APP_HANDLE.lock().as_ref() {
                            let _ = app.emit(
                                "deck-key-pressed",
                                serde_json::json!({
                                    "key": numpad_key
                                }),
                            );
                        }
                    }
                    // Suppress key-down in Deck Mode
                    return LRESULT(1);
                } else if is_key_up {
                    if let Some(down_keys) = DOWN_KEYS.lock().as_mut() {
                        down_keys.remove(&numpad_key);
                    }
                    // Suppress key-up in Deck Mode
                    return LRESULT(1);
                }
            }
        }

        // When Deck Mode is inactive, or for unmapped non-numpad keys, pass through normally
        unsafe { CallNextHookEx(None, code, wparam, lparam) }
    }

    fn is_activation_hotkey_pressed(kbd: &KBDLLHOOKSTRUCT) -> bool {
        let guard = HOTKEY_CONFIG.lock();
        let config = match guard.as_ref() {
            Some(c) => c,
            None => return false,
        };
        let target_vk = match_hotkey_key(&config.key);
        if kbd.vkCode != target_vk {
            return false;
        }

        unsafe {
            let ctrl_down = (GetAsyncKeyState(VK_CONTROL.0 as i32) as u16 & 0x8000) != 0;
            let alt_down = (GetAsyncKeyState(VK_MENU.0 as i32) as u16 & 0x8000) != 0;
            let shift_down = (GetAsyncKeyState(VK_SHIFT.0 as i32) as u16 & 0x8000) != 0;
            let win_down = (GetAsyncKeyState(VK_LWIN.0 as i32) as u16 & 0x8000) != 0
                || (GetAsyncKeyState(VK_RWIN.0 as i32) as u16 & 0x8000) != 0;

            ctrl_down == config.ctrl
                && alt_down == config.alt
                && shift_down == config.shift
                && win_down == config.win
        }
    }

    fn is_emergency_hotkey_pressed(kbd: &KBDLLHOOKSTRUCT) -> bool {
        if kbd.vkCode != VK_ESCAPE.0 as u32 {
            return false;
        }

        unsafe {
            let ctrl_down = (GetAsyncKeyState(VK_CONTROL.0 as i32) as u16 & 0x8000) != 0;
            let alt_down = (GetAsyncKeyState(VK_MENU.0 as i32) as u16 & 0x8000) != 0;
            let shift_down = (GetAsyncKeyState(VK_SHIFT.0 as i32) as u16 & 0x8000) != 0;

            ctrl_down && alt_down && shift_down
        }
    }

    pub fn identify_numpad_key(kbd: &KBDLLHOOKSTRUCT) -> Option<NumpadKey> {
        let is_extended = (kbd.flags.0 & LLKHF_EXTENDED.0) != 0;
        let vk = kbd.vkCode;
        let scan_byte = (kbd.scanCode & 0xFF) as u8;

        // 0. Check custom key mappings first (allows manual assignment for any unusual laptop key)
        {
            let custom_guard = CUSTOM_MAPPINGS.lock();
            if let Some(ref map) = *custom_guard {
                let sig_full = format!("0x{:X}_0x{:X}_{}", vk, scan_byte, is_extended);
                if let Some(mapped) = map.get(&sig_full) {
                    return Some(*mapped);
                }
                let sig_vk = format!("0x{:X}", vk);
                if let Some(mapped) = map.get(&sig_vk) {
                    return Some(*mapped);
                }
                let sig_scan = format!("scan_0x{:X}", scan_byte);
                if let Some(mapped) = map.get(&sig_scan) {
                    return Some(*mapped);
                }
            }
        }

        // 1. Direct Virtual-Key codes with NumLock ON
        match vk {
            0x60 => return Some(NumpadKey::Num0),
            0x61 => return Some(NumpadKey::Num1),
            0x62 => return Some(NumpadKey::Num2),
            0x63 => return Some(NumpadKey::Num3),
            0x64 => return Some(NumpadKey::Num4),
            0x65 => return Some(NumpadKey::Num5),
            0x66 => return Some(NumpadKey::Num6),
            0x67 => return Some(NumpadKey::Num7),
            0x68 => return Some(NumpadKey::Num8),
            0x69 => return Some(NumpadKey::Num9),
            0x6A => return Some(NumpadKey::Multiply),
            0x6B => return Some(NumpadKey::Plus),
            0x6D => return Some(NumpadKey::Subtract),
            0x6E => return Some(NumpadKey::Decimal),
            0x6F => return Some(NumpadKey::Divide),
            0x90 => return Some(NumpadKey::NumLock),
            _ => {}
        }

        // 2. Numpad Enter (VK_RETURN with extended flag or scan code 0x1C with extended)
        // Main keyboard Enter does NOT have LLKHF_EXTENDED set
        if (vk == VK_RETURN.0 as u32 || scan_byte == 0x1C) && is_extended {
            return Some(NumpadKey::Enter);
        }

        // 3. Numpad Divide: scan code 0x35 with extended flag, or VK 0x6F
        if (scan_byte == 0x35 && is_extended) || vk == 0x6F {
            return Some(NumpadKey::Divide);
        }

        // 4. Physical scan codes & Navigation virtual keys when NumLock is OFF:
        // On PC architecture, physical numpad navigation keys are standard (non-extended),
        // whereas dedicated navigation keys (arrow keys, dedicated Home/End) have LLKHF_EXTENDED set.
        if !is_extended {
            // Match by physical scan code
            match scan_byte {
                0x45 => return Some(NumpadKey::NumLock),
                0x37 => return Some(NumpadKey::Multiply),
                0x4A => return Some(NumpadKey::Subtract),
                0x4E => return Some(NumpadKey::Plus),
                0x47 => return Some(NumpadKey::Num7),
                0x48 => return Some(NumpadKey::Num8),
                0x49 => return Some(NumpadKey::Num9),
                0x4B => return Some(NumpadKey::Num4),
                0x4C => return Some(NumpadKey::Num5),
                0x4D => return Some(NumpadKey::Num6),
                0x4F => return Some(NumpadKey::Num1),
                0x50 => return Some(NumpadKey::Num2),
                0x51 => return Some(NumpadKey::Num3),
                0x52 => return Some(NumpadKey::Num0),
                0x53 => return Some(NumpadKey::Decimal),
                _ => {}
            }

            // Fallback match by navigation Virtual Key for NumLock OFF
            match vk {
                0x2D => return Some(NumpadKey::Num0),    // Insert -> 0
                0x23 => return Some(NumpadKey::Num1),    // End -> 1
                0x28 => return Some(NumpadKey::Num2),    // Down -> 2
                0x22 => return Some(NumpadKey::Num3),    // Next/PgDn -> 3
                0x25 => return Some(NumpadKey::Num4),    // Left -> 4
                0x0C => return Some(NumpadKey::Num5),    // Clear -> 5
                0x27 => return Some(NumpadKey::Num6),    // Right -> 6
                0x24 => return Some(NumpadKey::Num7),    // Home -> 7
                0x26 => return Some(NumpadKey::Num8),    // Up -> 8
                0x21 => return Some(NumpadKey::Num9),    // Prior/PgUp -> 9
                0x2E => return Some(NumpadKey::Decimal), // Delete -> Decimal
                _ => {}
            }
        }

        // 5. If Compact Laptop Mode is active, support top-row numbers (for laptops without dedicated numpad)
        if COMPACT_LAPTOP_MODE.load(Ordering::SeqCst) {
            match vk {
                0x31 => return Some(NumpadKey::Num1),
                0x32 => return Some(NumpadKey::Num2),
                0x33 => return Some(NumpadKey::Num3),
                0x34 => return Some(NumpadKey::Num4),
                0x35 => return Some(NumpadKey::Num5),
                0x36 => return Some(NumpadKey::Num6),
                0x37 => return Some(NumpadKey::Num7),
                0x38 => return Some(NumpadKey::Num8),
                0x39 => return Some(NumpadKey::Num9),
                0x30 => return Some(NumpadKey::Num0),
                0xBD => return Some(NumpadKey::Subtract), // '-'
                0xBB => return Some(NumpadKey::Plus),     // '+' / '='
                0xBE => return Some(NumpadKey::Decimal),  // '.'
                0xBF => return Some(NumpadKey::Divide),   // '/'
                0xC0 => return Some(NumpadKey::NumLock),  // '`'
                _ => {}
            }
        }

        None
    }
}

pub fn vk_to_name(vk: u32) -> &'static str {
    match vk {
        0x60 => "VK_NUMPAD0",
        0x61 => "VK_NUMPAD1",
        0x62 => "VK_NUMPAD2",
        0x63 => "VK_NUMPAD3",
        0x64 => "VK_NUMPAD4",
        0x65 => "VK_NUMPAD5",
        0x66 => "VK_NUMPAD6",
        0x67 => "VK_NUMPAD7",
        0x68 => "VK_NUMPAD8",
        0x69 => "VK_NUMPAD9",
        0x6A => "VK_MULTIPLY",
        0x6B => "VK_ADD",
        0x6D => "VK_SUBTRACT",
        0x6E => "VK_DECIMAL",
        0x6F => "VK_DIVIDE",
        0x90 => "VK_NUMLOCK",
        0x0D => "VK_RETURN",
        0x24 => "VK_HOME",
        0x26 => "VK_UP",
        0x21 => "VK_PRIOR",
        0x25 => "VK_LEFT",
        0x0C => "VK_CLEAR",
        0x27 => "VK_RIGHT",
        0x23 => "VK_END",
        0x28 => "VK_DOWN",
        0x22 => "VK_NEXT",
        0x2D => "VK_INSERT",
        0x2E => "VK_DELETE",
        0x1B => "VK_ESCAPE",
        0x08 => "VK_BACK",
        0x09 => "VK_TAB",
        0x20 => "VK_SPACE",
        0x10 => "VK_SHIFT",
        0x11 => "VK_CONTROL",
        0x12 => "VK_MENU (ALT)",
        0x30 => "VK_0",
        0x31 => "VK_1",
        0x32 => "VK_2",
        0x33 => "VK_3",
        0x34 => "VK_4",
        0x35 => "VK_5",
        0x36 => "VK_6",
        0x37 => "VK_7",
        0x38 => "VK_8",
        0x39 => "VK_9",
        0xBA => "VK_OEM_1 (;)",
        0xBB => "VK_OEM_PLUS (+)",
        0xBC => "VK_OEM_COMMA (,)",
        0xBD => "VK_OEM_MINUS (-)",
        0xBE => "VK_OEM_PERIOD (.)",
        0xBF => "VK_OEM_2 (/)",
        0xC0 => "VK_OEM_3 (`)",
        _ => "VK_OTHER",
    }
}

fn format_time_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    let secs = dur.as_secs();
    let millis = dur.subsec_millis();
    let hours = (secs / 3600) % 24;
    let minutes = (secs / 60) % 60;
    let seconds = secs % 60;
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, seconds, millis)
}

fn match_hotkey_key(key: &str) -> u32 {
    match key.to_uppercase().as_str() {
        "F1" => VK_F1.0 as u32,
        "F2" => VK_F2.0 as u32,
        "F3" => VK_F3.0 as u32,
        "F4" => VK_F4.0 as u32,
        "F5" => VK_F5.0 as u32,
        "F6" => VK_F6.0 as u32,
        "F7" => VK_F7.0 as u32,
        "F8" => VK_F8.0 as u32,
        "F9" => VK_F9.0 as u32,
        "F10" => VK_F10.0 as u32,
        "F11" => VK_F11.0 as u32,
        "F12" => VK_F12.0 as u32,
        "SPACE" => VK_SPACE.0 as u32,
        "TAB" => VK_TAB.0 as u32,
        "ESCAPE" | "ESC" => VK_ESCAPE.0 as u32,
        _ => VK_F12.0 as u32,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_kbd(vk: u32, scan: u32, extended: bool) -> KBDLLHOOKSTRUCT {
        KBDLLHOOKSTRUCT {
            vkCode: vk,
            scanCode: scan,
            flags: if extended { LLKHF_EXTENDED } else { KBDLLHOOKSTRUCT_FLAGS(0) },
            time: 0,
            dwExtraInfo: 0,
        }
    }

    #[test]
    fn test_numpad_numeric_keys_numlock_on() {
        let kbd7 = make_kbd(0x67, 0x47, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&kbd7), Some(NumpadKey::Num7));

        let kbd0 = make_kbd(0x60, 0x52, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&kbd0), Some(NumpadKey::Num0));
    }

    #[test]
    fn test_numpad_enter_distinction() {
        // Numpad Enter has LLKHF_EXTENDED set
        let numpad_enter = make_kbd(VK_RETURN.0 as u32, 0x1C, true);
        assert_eq!(KeyboardEngine::identify_numpad_key(&numpad_enter), Some(NumpadKey::Enter));

        // Regular main keyboard Enter has LLKHF_EXTENDED unset
        let regular_enter = make_kbd(VK_RETURN.0 as u32, 0x1C, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&regular_enter), None);
    }

    #[test]
    fn test_numpad_keys_numlock_off() {
        // When NumLock is OFF, physical 7 sends scan code 0x47 with non-extended
        let numpad_7_numlock_off = make_kbd(0x24, 0x47, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&numpad_7_numlock_off), Some(NumpadKey::Num7));

        // When NumLock is OFF, physical 0 sends scan code 0x52 with non-extended
        let numpad_0_numlock_off = make_kbd(0x2D, 0x52, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&numpad_0_numlock_off), Some(NumpadKey::Num0));
    }

    #[test]
    fn test_dedicated_arrow_keys_not_mistaken_for_numpad() {
        // Dedicated Up Arrow key has scan 0x48 BUT is_extended is true!
        let dedicated_up_arrow = make_kbd(0x26, 0x48, true);
        assert_eq!(KeyboardEngine::identify_numpad_key(&dedicated_up_arrow), None);

        // Dedicated Left Arrow has scan 0x4B BUT is_extended is true!
        let dedicated_left_arrow = make_kbd(0x25, 0x4B, true);
        assert_eq!(KeyboardEngine::identify_numpad_key(&dedicated_left_arrow), None);
    }

    #[test]
    fn test_operators() {
        let multiply = make_kbd(0x6A, 0x37, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&multiply), Some(NumpadKey::Multiply));

        let add = make_kbd(0x6B, 0x4E, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&add), Some(NumpadKey::Plus));

        let divide = make_kbd(0x6F, 0x35, true);
        assert_eq!(KeyboardEngine::identify_numpad_key(&divide), Some(NumpadKey::Divide));
    }

    #[test]
    fn test_custom_key_mapping_override() {
        // Map an arbitrary scan code / key signature to NumpadKey::Enter
        KeyboardEngine::add_custom_mapping("0xFF_0xAA_false".to_string(), NumpadKey::Enter);
        let custom_key = make_kbd(0xFF, 0xAA, false);
        assert_eq!(KeyboardEngine::identify_numpad_key(&custom_key), Some(NumpadKey::Enter));
    }
}
