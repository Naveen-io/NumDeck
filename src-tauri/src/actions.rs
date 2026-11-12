use crate::types::*;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::process::Command;
use std::time::Duration;
use windows::core::PCWSTR;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

pub const SYNTHETIC_EXTRA_INFO: usize = 0xDEC42;

pub struct ActionExecutor;

impl ActionExecutor {
    pub async fn execute(action: &ActionConfig) -> Result<(), String> {
        match action {
            ActionConfig::None => Ok(()),
            ActionConfig::LaunchApp {
                path,
                arguments,
                working_dir,
            } => Self::launch_app(path, arguments, working_dir.as_deref()),
            ActionConfig::OpenUrl { url } => Self::open_url(url),
            ActionConfig::OpenFileFolder { path } => Self::open_file_folder(path),
            ActionConfig::SendHotkey { modifiers, key } => Self::send_hotkey(modifiers, key),
            ActionConfig::TypeText { text } => Self::type_text(text),
            ActionConfig::SystemMedia { command } => Self::system_media(*command),
            ActionConfig::NavigateFolder { .. } => {
                // Handled in state manager
                Ok(())
            }
            ActionConfig::SwitchProfile { .. } => {
                // Handled in state manager
                Ok(())
            }
            ActionConfig::MultiAction { steps } => Self::execute_multi_action(steps).await,
        }
    }

    fn to_wide(s: &str) -> Vec<u16> {
        OsStr::new(s).encode_wide().chain(Some(0)).collect()
    }

    fn launch_app(
        path: &str,
        arguments: &[String],
        working_dir: Option<&str>,
    ) -> Result<(), String> {
        let mut cmd = Command::new(path);
        cmd.args(arguments);
        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }

        cmd.spawn()
            .map(|_| ())
            .or_else(|_| {
                // Fallback to ShellExecuteW
                let wide_path = Self::to_wide(path);
                let wide_args = if arguments.is_empty() {
                    Vec::new()
                } else {
                    Self::to_wide(&arguments.join(" "))
                };
                let wide_dir = working_dir.map(Self::to_wide);

                unsafe {
                    let res = ShellExecuteW(
                        HWND::default(),
                        PCWSTR(Self::to_wide("open").as_ptr()),
                        PCWSTR(wide_path.as_ptr()),
                        if wide_args.is_empty() {
                            PCWSTR::null()
                        } else {
                            PCWSTR(wide_args.as_ptr())
                        },
                        match &wide_dir {
                            Some(d) => PCWSTR(d.as_ptr()),
                            None => PCWSTR::null(),
                        },
                        SW_SHOWNORMAL,
                    );
                    if res.0 as usize <= 32 {
                        Err(format!("ShellExecute error code: {:?}", res.0))
                    } else {
                        Ok(())
                    }
                }
            })
            .map_err(|e| format!("Failed to launch app '{path}': {e}"))
    }

    fn open_url(url: &str) -> Result<(), String> {
        let wide_url = Self::to_wide(url);
        let wide_verb = Self::to_wide("open");

        unsafe {
            let res = ShellExecuteW(
                HWND::default(),
                PCWSTR(wide_verb.as_ptr()),
                PCWSTR(wide_url.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOWNORMAL,
            );
            if res.0 as usize <= 32 {
                Err(format!("Failed to open URL '{url}', error: {:?}", res.0))
            } else {
                Ok(())
            }
        }
    }

    fn open_file_folder(path: &str) -> Result<(), String> {
        let wide_path = Self::to_wide(path);
        let wide_verb = Self::to_wide("open");

        unsafe {
            let res = ShellExecuteW(
                HWND::default(),
                PCWSTR(wide_verb.as_ptr()),
                PCWSTR(wide_path.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOWNORMAL,
            );
            if res.0 as usize <= 32 {
                Err(format!("Failed to open path '{path}', error: {:?}", res.0))
            } else {
                Ok(())
            }
        }
    }

    fn send_hotkey(modifiers: &[String], key_str: &str) -> Result<(), String> {
        let mut mod_vks = Vec::new();
        for m in modifiers {
            match m.to_lowercase().as_str() {
                "ctrl" | "control" => mod_vks.push(VK_CONTROL),
                "alt" => mod_vks.push(VK_MENU),
                "shift" => mod_vks.push(VK_SHIFT),
                "win" | "meta" | "cmd" => mod_vks.push(VK_LWIN),
                _ => {}
            }
        }

        let main_vk = match_virtual_key(key_str).ok_or_else(|| format!("Unknown key: {key_str}"))?;

        let mut inputs = Vec::new();

        // 1. Modifiers down
        for vk in &mod_vks {
            inputs.push(create_key_input(*vk, 0, false, false));
        }

        // 2. Key down & up
        inputs.push(create_key_input(main_vk, 0, false, false));
        inputs.push(create_key_input(main_vk, 0, true, false));

        // 3. Modifiers up (reverse order)
        for vk in mod_vks.iter().rev() {
            inputs.push(create_key_input(*vk, 0, true, false));
        }

        unsafe {
            let sent = SendInput(
                &inputs,
                std::mem::size_of::<INPUT>() as i32,
            );
            if sent != inputs.len() as u32 {
                return Err("Failed to send full hotkey sequence".into());
            }
        }

        Ok(())
    }

    fn type_text(text: &str) -> Result<(), String> {
        let mut inputs = Vec::new();
        for c in text.encode_utf16() {
            // Key down unicode
            inputs.push(create_key_input(VIRTUAL_KEY(0), c, false, true));
            // Key up unicode
            inputs.push(create_key_input(VIRTUAL_KEY(0), c, true, true));
        }

        if !inputs.is_empty() {
            unsafe {
                SendInput(
                    &inputs,
                    std::mem::size_of::<INPUT>() as i32,
                );
            }
        }

        Ok(())
    }

    fn system_media(cmd: SystemMediaCommand) -> Result<(), String> {
        match cmd {
            SystemMediaCommand::VolumeUp => Self::send_single_key(VK_VOLUME_UP),
            SystemMediaCommand::VolumeDown => Self::send_single_key(VK_VOLUME_DOWN),
            SystemMediaCommand::VolumeMute => Self::send_single_key(VK_VOLUME_MUTE),
            SystemMediaCommand::PlayPause => Self::send_single_key(VK_MEDIA_PLAY_PAUSE),
            SystemMediaCommand::NextTrack => Self::send_single_key(VK_MEDIA_NEXT_TRACK),
            SystemMediaCommand::PreviousTrack => Self::send_single_key(VK_MEDIA_PREV_TRACK),
            SystemMediaCommand::LockScreen => {
                let _ = Command::new("rundll32.exe")
                    .args(["user32.dll,LockWorkStation"])
                    .spawn();
                Ok(())
            }
        }
    }

    fn send_single_key(vk: VIRTUAL_KEY) -> Result<(), String> {
        let inputs = [
            create_key_input(vk, 0, false, false),
            create_key_input(vk, 0, true, false),
        ];

        unsafe {
            SendInput(
                &inputs,
                std::mem::size_of::<INPUT>() as i32,
            );
        }

        Ok(())
    }

    async fn execute_multi_action(steps: &[MultiActionStep]) -> Result<(), String> {
        for step in steps {
            if !step.enabled {
                continue;
            }

            if step.delay_ms > 0 {
                tokio::time::sleep(Duration::from_millis(step.delay_ms)).await;
            }

            if let Err(e) = Box::pin(Self::execute(&step.action)).await {
                eprintln!("[MultiAction] Step '{}' failed: {e}", step.name);
            }
        }

        Ok(())
    }
}

fn create_key_input(vk: VIRTUAL_KEY, scan: u16, key_up: bool, unicode: bool) -> INPUT {
    let mut flags = KEYBD_EVENT_FLAGS(0);
    if key_up {
        flags |= KEYEVENTF_KEYUP;
    }
    if unicode {
        flags |= KEYEVENTF_UNICODE;
    }

    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: scan,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: SYNTHETIC_EXTRA_INFO,
            },
        },
    }
}

fn match_virtual_key(s: &str) -> Option<VIRTUAL_KEY> {
    match s.to_lowercase().as_str() {
        "a" => Some(VIRTUAL_KEY(0x41)),
        "b" => Some(VIRTUAL_KEY(0x42)),
        "c" => Some(VIRTUAL_KEY(0x43)),
        "d" => Some(VIRTUAL_KEY(0x44)),
        "e" => Some(VIRTUAL_KEY(0x45)),
        "f" => Some(VIRTUAL_KEY(0x46)),
        "g" => Some(VIRTUAL_KEY(0x47)),
        "h" => Some(VIRTUAL_KEY(0x48)),
        "i" => Some(VIRTUAL_KEY(0x49)),
        "j" => Some(VIRTUAL_KEY(0x4A)),
        "k" => Some(VIRTUAL_KEY(0x4B)),
        "l" => Some(VIRTUAL_KEY(0x4C)),
        "m" => Some(VIRTUAL_KEY(0x4D)),
        "n" => Some(VIRTUAL_KEY(0x4E)),
        "o" => Some(VIRTUAL_KEY(0x4F)),
        "p" => Some(VIRTUAL_KEY(0x50)),
        "q" => Some(VIRTUAL_KEY(0x51)),
        "r" => Some(VIRTUAL_KEY(0x52)),
        "s" => Some(VIRTUAL_KEY(0x53)),
        "t" => Some(VIRTUAL_KEY(0x54)),
        "u" => Some(VIRTUAL_KEY(0x55)),
        "v" => Some(VIRTUAL_KEY(0x56)),
        "w" => Some(VIRTUAL_KEY(0x57)),
        "x" => Some(VIRTUAL_KEY(0x58)),
        "y" => Some(VIRTUAL_KEY(0x59)),
        "z" => Some(VIRTUAL_KEY(0x5A)),
        "0" => Some(VIRTUAL_KEY(0x30)),
        "1" => Some(VIRTUAL_KEY(0x31)),
        "2" => Some(VIRTUAL_KEY(0x32)),
        "3" => Some(VIRTUAL_KEY(0x33)),
        "4" => Some(VIRTUAL_KEY(0x34)),
        "5" => Some(VIRTUAL_KEY(0x35)),
        "6" => Some(VIRTUAL_KEY(0x36)),
        "7" => Some(VIRTUAL_KEY(0x37)),
        "8" => Some(VIRTUAL_KEY(0x38)),
        "9" => Some(VIRTUAL_KEY(0x39)),
        "f1" => Some(VK_F1),
        "f2" => Some(VK_F2),
        "f3" => Some(VK_F3),
        "f4" => Some(VK_F4),
        "f5" => Some(VK_F5),
        "f6" => Some(VK_F6),
        "f7" => Some(VK_F7),
        "f8" => Some(VK_F8),
        "f9" => Some(VK_F9),
        "f10" => Some(VK_F10),
        "f11" => Some(VK_F11),
        "f12" => Some(VK_F12),
        "escape" | "esc" => Some(VK_ESCAPE),
        "tab" => Some(VK_TAB),
        "enter" | "return" => Some(VK_RETURN),
        "space" => Some(VK_SPACE),
        "backspace" => Some(VK_BACK),
        "delete" | "del" => Some(VK_DELETE),
        "insert" | "ins" => Some(VK_INSERT),
        "home" => Some(VK_HOME),
        "end" => Some(VK_END),
        "pageup" | "pgup" => Some(VK_PRIOR),
        "pagedown" | "pgdn" => Some(VK_NEXT),
        "up" => Some(VK_UP),
        "down" => Some(VK_DOWN),
        "left" => Some(VK_LEFT),
        "right" => Some(VK_RIGHT),
        _ => None,
    }
}
