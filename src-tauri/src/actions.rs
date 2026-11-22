use crate::types::ActionConfig;
use std::process::Command;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;
#[cfg(target_os = "windows")]
use std::ptr;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Shell::ShellExecuteW;
#[cfg(target_os = "windows")]
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
            // State-only or passthrough actions are handled directly by the hook engine
            ActionConfig::SwitchProfile { .. }
            | ActionConfig::NavigateFolder { .. }
            | ActionConfig::BackToRootFolder
            | ActionConfig::ToggleDeckMode
            | ActionConfig::Passthrough => Ok(()),
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
    #[cfg(target_os = "windows")]
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

    /// Open file, folder, URL, or protocol link using Linux xdg-open
    #[cfg(target_os = "linux")]
    fn open_path(path: &str) -> Result<(), String> {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open path via xdg-open: {}", e))?;
        Ok(())
    }

    /// Send System Media keys
    #[cfg(target_os = "windows")]
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

    /// Send System Media keys on Linux via playerctl or pactl / xdotool
    #[cfg(target_os = "linux")]
    fn send_system_media(command: &str) -> Result<(), String> {
        let cmd_lower = command.to_lowercase();
        match cmd_lower.as_str() {
            "play_pause" => {
                if Command::new("playerctl").arg("play-pause").spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioPlay"]).spawn();
            }
            "next_track" => {
                if Command::new("playerctl").arg("next").spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioNext"]).spawn();
            }
            "prev_track" => {
                if Command::new("playerctl").arg("previous").spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioPrev"]).spawn();
            }
            "mute" => {
                if Command::new("pactl").args(["set-sink-mute", "@DEFAULT_SINK@", "toggle"]).spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioMute"]).spawn();
            }
            "volume_up" => {
                if Command::new("pactl").args(["set-sink-volume", "@DEFAULT_SINK@", "+5%"]).spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioRaiseVolume"]).spawn();
            }
            "volume_down" => {
                if Command::new("pactl").args(["set-sink-volume", "@DEFAULT_SINK@", "-5%"]).spawn().is_ok() {
                    return Ok(());
                }
                let _ = Command::new("xdotool").args(["key", "XF86AudioLowerVolume"]).spawn();
            }
            _ => return Err(format!("Unknown media command: {}", command)),
        }
        Ok(())
    }

    /// Simulate key-down followed by key-up for a virtual key code
    #[cfg(target_os = "windows")]
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
    #[cfg(target_os = "windows")]
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

    /// Type arbitrary Unicode text on Linux using xdotool
    #[cfg(target_os = "linux")]
    fn type_unicode_text(text: &str) -> Result<(), String> {
        Command::new("xdotool")
            .args(["type", "--clearmodifiers", "--", text])
            .spawn()
            .map_err(|e| format!("Failed to type text via xdotool: {}", e))?;
        Ok(())
    }

    /// Press a hotkey combo on Windows
    #[cfg(target_os = "windows")]
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

    /// Press a hotkey combo on Linux using xdotool
    #[cfg(target_os = "linux")]
    fn send_hotkey(modifiers: &[String], key: &str) -> Result<(), String> {
        let mut combo = Vec::new();
        for m in modifiers {
            match m.to_lowercase().as_str() {
                "ctrl" | "control" => combo.push("ctrl"),
                "alt" => combo.push("alt"),
                "shift" => combo.push("shift"),
                "win" | "meta" | "super" => combo.push("super"),
                _ => {}
            }
        }
        combo.push(key);
        let combo_str = combo.join("+");
        Command::new("xdotool")
            .args(["key", &combo_str])
            .spawn()
            .map_err(|e| format!("Failed to send hotkey via xdotool: {}", e))?;
        Ok(())
    }

    /// Convert common key name to VK code
    #[cfg(target_os = "windows")]
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
