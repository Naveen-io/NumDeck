use crate::types::ActionConfig;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::process::Command;
use std::ptr;
use std::thread;
use std::time::Duration;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::Shell::ShellExecuteW;
use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

pub struct ActionExecutor;

impl ActionExecutor {
    pub fn execute(action: ActionConfig) -> Result<(), String> {
        match action {
            ActionConfig::LaunchApp { path, arguments } => {
                Self::launch_app(&path, arguments.as_deref())
            }
            ActionConfig::OpenPath { path } => Self::open_path(&path),
            ActionConfig::Hotkey { modifiers, key } => Self::send_hotkey(&modifiers, &key),
            ActionConfig::TypeText { text } => Self::type_unicode_text(&text),
            ActionConfig::SystemMedia { command } => Self::send_system_media(&command),
            ActionConfig::MultiAction { steps } => {
                for step in steps {
                    if let Err(e) = Self::execute(step.action) {
                        log::warn!("MultiAction step failed: {}", e);
                    }
                    if step.delay_ms > 0 {
                        thread::sleep(Duration::from_millis(step.delay_ms));
                    }
                }
                Ok(())
            }
            // State-only actions are handled by the controller
            ActionConfig::SwitchProfile { .. }
            | ActionConfig::NavigateFolder { .. }
            | ActionConfig::BackToRootFolder
            | ActionConfig::ToggleDeckMode => Ok(()),
        }
    }

    /// Launch executable or process
    fn launch_app(path: &str, arguments: Option<&str>) -> Result<(), String> {
        let mut cmd = Command::new(path);
        if let Some(args) = arguments {
            if !args.trim().is_empty() {
                cmd.args(args.split_whitespace());
            }
        }
        cmd.spawn()
            .map_err(|e| format!("Failed to launch '{}': {}", path, e))?;
        Ok(())
    }

    /// Open file, folder, URL, or protocol link using Windows ShellExecuteW
    fn open_path(path: &str) -> Result<(), String> {
        let wide_path: Vec<u16> = OsStr::new(path).encode_wide().chain(Some(0)).collect();
        let wide_op: Vec<u16> = OsStr::new("open").encode_wide().chain(Some(0)).collect();

        unsafe {
            let res = ShellExecuteW(
                ptr::null_mut(),
                wide_op.as_ptr(),
                wide_path.as_ptr(),
                ptr::null(),
                ptr::null(),
                SW_SHOWNORMAL,
            );
            if (res as isize) <= 32 {
                return Err(format!("ShellExecuteW failed with error code: {}", res as isize));
            }
        }
        Ok(())
    }

    /// Send System Media keys
    fn send_system_media(command: &str) -> Result<(), String> {
        let vk = match command.to_lowercase().as_str() {
            "volume_up" => VK_VOLUME_UP,
            "volume_down" => VK_VOLUME_DOWN,
            "mute" => VK_VOLUME_MUTE,
            "play_pause" => VK_MEDIA_PLAY_PAUSE,
            "next_track" => VK_MEDIA_NEXT_TRACK,
            "prev_track" => VK_MEDIA_PREV_TRACK,
            _ => return Err(format!("Unknown media command: {}", command)),
        };

        Self::tap_vk(vk);
        Ok(())
    }

    /// Simulate key-down followed by key-up for a virtual key code
    fn tap_vk(vk: u16) {
        unsafe {
            let mut inputs: [INPUT; 2] = std::mem::zeroed();

            // Key Down
            inputs[0].r#type = INPUT_KEYBOARD;
            inputs[0].Anonymous.ki.wVk = vk;
            inputs[0].Anonymous.ki.dwFlags = KEYEVENTF_EXTENDEDKEY;

            // Key Up
            inputs[1].r#type = INPUT_KEYBOARD;
            inputs[1].Anonymous.ki.wVk = vk;
            inputs[1].Anonymous.ki.dwFlags = KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP;

            SendInput(2, inputs.as_mut_ptr(), std::mem::size_of::<INPUT>() as i32);
        }
    }

    /// Type arbitrary Unicode string directly without layout quirks
    fn type_unicode_text(text: &str) -> Result<(), String> {
        for ch in text.chars() {
            if ch == '\n' {
                Self::tap_vk(VK_RETURN);
                continue;
            }

            let mut utf16_buf = [0u16; 2];
            let encoded = ch.encode_utf16(&mut utf16_buf);

            for &code_unit in encoded.iter() {
                unsafe {
                    let mut inputs: [INPUT; 2] = std::mem::zeroed();

                    // Key Down Unicode
                    inputs[0].r#type = INPUT_KEYBOARD;
                    inputs[0].Anonymous.ki.wScan = code_unit;
                    inputs[0].Anonymous.ki.dwFlags = KEYEVENTF_UNICODE;

                    // Key Up Unicode
                    inputs[1].r#type = INPUT_KEYBOARD;
                    inputs[1].Anonymous.ki.wScan = code_unit;
                    inputs[1].Anonymous.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

                    SendInput(2, inputs.as_mut_ptr(), std::mem::size_of::<INPUT>() as i32);
                }
            }
            thread::sleep(Duration::from_millis(5));
        }
        Ok(())
    }

    /// Press a hotkey combo: Modifiers Down -> Key Down -> Key Up -> Modifiers Up
    fn send_hotkey(modifiers: &[String], key: &str) -> Result<(), String> {
        let mut mod_vks = Vec::new();
        for m in modifiers {
            match m.to_lowercase().as_str() {
                "ctrl" | "control" => mod_vks.push(VK_CONTROL),
                "alt" => mod_vks.push(VK_MENU),
                "shift" => mod_vks.push(VK_SHIFT),
                "win" | "meta" | "super" => mod_vks.push(VK_LWIN),
                _ => {}
            }
        }

        let main_vk = Self::parse_key_to_vk(key)
            .ok_or_else(|| format!("Unknown key for hotkey: {}", key))?;

        unsafe {
            // 1. Modifiers Down
            for &m_vk in &mod_vks {
                let mut input: INPUT = std::mem::zeroed();
                input.r#type = INPUT_KEYBOARD;
                input.Anonymous.ki.wVk = m_vk;
                SendInput(1, &mut input, std::mem::size_of::<INPUT>() as i32);
            }

            // 2. Main Key Tap
            let mut inputs: [INPUT; 2] = std::mem::zeroed();
            inputs[0].r#type = INPUT_KEYBOARD;
            inputs[0].Anonymous.ki.wVk = main_vk;
            inputs[1].r#type = INPUT_KEYBOARD;
            inputs[1].Anonymous.ki.wVk = main_vk;
            inputs[1].Anonymous.ki.dwFlags = KEYEVENTF_KEYUP;
            SendInput(2, inputs.as_mut_ptr(), std::mem::size_of::<INPUT>() as i32);

            // 3. Modifiers Up (in reverse order)
            for &m_vk in mod_vks.iter().rev() {
                let mut input: INPUT = std::mem::zeroed();
                input.r#type = INPUT_KEYBOARD;
                input.Anonymous.ki.wVk = m_vk;
                input.Anonymous.ki.dwFlags = KEYEVENTF_KEYUP;
                SendInput(1, &mut input, std::mem::size_of::<INPUT>() as i32);
            }
        }

        Ok(())
    }

    /// Convert common key name to VK code
    fn parse_key_to_vk(key_name: &str) -> Option<u16> {
        let upper = key_name.trim().to_uppercase();
        if upper.len() == 1 {
            let ch = upper.chars().next().unwrap();
            if ch.is_ascii_alphanumeric() {
                return Some(ch as u16);
            }
        }

        match upper.as_str() {
            "ESCAPE" | "ESC" => Some(VK_ESCAPE),
            "ENTER" | "RETURN" => Some(VK_RETURN),
            "TAB" => Some(VK_TAB),
            "SPACE" => Some(VK_SPACE),
            "BACKSPACE" => Some(VK_BACK),
            "DELETE" | "DEL" => Some(VK_DELETE),
            "INSERT" | "INS" => Some(VK_INSERT),
            "HOME" => Some(VK_HOME),
            "END" => Some(VK_END),
            "PAGEUP" | "PGUP" => Some(VK_PRIOR),
            "PAGEDOWN" | "PGDN" => Some(VK_NEXT),
            "UP" => Some(VK_UP),
            "DOWN" => Some(VK_DOWN),
            "LEFT" => Some(VK_LEFT),
            "RIGHT" => Some(VK_RIGHT),
            "F1" => Some(VK_F1),
            "F2" => Some(VK_F2),
            "F3" => Some(VK_F3),
            "F4" => Some(VK_F4),
            "F5" => Some(VK_F5),
            "F6" => Some(VK_F6),
            "F7" => Some(VK_F7),
            "F8" => Some(VK_F8),
            "F9" => Some(VK_F9),
            "F10" => Some(VK_F10),
            "F11" => Some(VK_F11),
            "F12" => Some(VK_F12),
            _ => None,
        }
    }
}
