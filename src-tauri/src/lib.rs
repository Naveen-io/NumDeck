pub mod actions;
pub mod config;
pub mod icons;
pub mod keyboard;
pub mod types;

use actions::ActionExecutor;
use config::ConfigManager;
use keyboard::KeyboardEngine;
use parking_lot::RwLock;
use tauri::{
    command,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use types::*;
use windows_sys::Win32::System::Registry::{
    RegCloseKey, RegDeleteValueW, RegOpenKeyExW, RegSetValueExW, HKEY_CURRENT_USER, KEY_SET_VALUE,
    REG_SZ,
};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

pub fn update_startup_registry(enable: bool) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    fn to_wide(s: &str) -> Vec<u16> {
        OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
    }

    let subkey = to_wide("Software\\Microsoft\\Windows\\CurrentVersion\\Run");
    let mut hkey = std::ptr::null_mut();

    let status = unsafe {
        RegOpenKeyExW(
            HKEY_CURRENT_USER,
            subkey.as_ptr(),
            0,
            KEY_SET_VALUE,
            &mut hkey,
        )
    };

    if status != 0 {
        return Err(format!("Failed to open Run registry key: error code {}", status));
    }

    let value_name = to_wide("NumDeck");

    let result = if enable {
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = format!("\"{}\"", exe_path.to_string_lossy());
        let wide_data = to_wide(&exe_str);
        let byte_len = (wide_data.len() * 2) as u32;

        let set_status = unsafe {
            RegSetValueExW(
                hkey,
                value_name.as_ptr(),
                0,
                REG_SZ,
                wide_data.as_ptr() as *const u8,
                byte_len,
            )
        };
        if set_status == 0 {
            Ok(())
        } else {
            Err(format!("Failed to set registry value: error code {}", set_status))
        }
    } else {
        unsafe {
            let _ = RegDeleteValueW(hkey, value_name.as_ptr());
        }
        Ok(())
    };

    unsafe {
        RegCloseKey(hkey);
    }

    result
}

pub struct AppContext {
    pub engine: RwLock<Option<KeyboardEngine>>,
    pub config_manager: ConfigManager,
    pub data: RwLock<AppData>,
}

#[command]
fn get_initial_data(context: State<'_, AppContext>) -> Result<AppData, String> {
    Ok(context.data.read().clone())
}

#[command]
fn get_engine_mode(context: State<'_, AppContext>) -> Result<EngineMode, String> {
    if let Some(engine) = context.engine.read().as_ref() {
        Ok(*engine.state().mode.read())
    } else {
        Ok(EngineMode::Normal)
    }
}

#[command]
fn set_engine_mode(
    mode: EngineMode,
    context: State<'_, AppContext>,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(engine) = context.engine.read().as_ref() {
        *engine.state().mode.write() = mode;
        if mode != EngineMode::Calibrating {
            let is_deck = mode == EngineMode::Deck;
            let _ = app.emit("deck-mode-changed", is_deck);
        }
        log::info!("Engine mode set to: {:?}", mode);
    }
    if mode != EngineMode::Calibrating {
        let mut data = context.data.write();
        data.settings.deck_mode = mode == EngineMode::Deck;
        let _ = context.config_manager.save(&data);
    }
    Ok(())
}

#[command]
fn get_numlock_state() -> bool {
    unsafe { (GetKeyState(VK_NUMLOCK as i32) & 1) != 0 }
}

#[command]
fn set_active_profile(
    profile_id: String,
    context: State<'_, AppContext>,
    app: AppHandle,
) -> Result<(), String> {
    let mut data = context.data.write();
    let target = data.profiles.iter().find(|p| p.id == profile_id).cloned();

    if let Some(profile) = target {
        data.settings.active_profile_id = profile_id.clone();
        if let Some(engine) = context.engine.read().as_ref() {
            *engine.state().active_profile.write() = profile;
            *engine.state().active_folder_id.write() = None;
        }
        let _ = context.config_manager.save(&data);
        let _ = app.emit("profile-switched", profile_id);
        Ok(())
    } else {
        Err(format!("Profile '{}' not found", profile_id))
    }
}

#[command]
fn save_profiles(
    profiles: Vec<Profile>,
    context: State<'_, AppContext>,
) -> Result<(), String> {
    let mut data = context.data.write();
    data.profiles = profiles;

    // Update active profile in engine if it was updated
    let active_id = data.settings.active_profile_id.clone();
    if let Some(curr) = data.profiles.iter().find(|p| p.id == active_id).cloned() {
        if let Some(engine) = context.engine.read().as_ref() {
            *engine.state().active_profile.write() = curr;
        }
    }

    context.config_manager.save(&data)
}

#[command]
fn save_settings(
    settings: AppSettings,
    context: State<'_, AppContext>,
) -> Result<(), String> {
    let mut data = context.data.write();
    let old_run_at_startup = data.settings.run_at_startup;
    data.settings = settings.clone();

    if let Some(engine) = context.engine.read().as_ref() {
        engine
            .state()
            .emergency_shortcut_enabled
            .store(settings.emergency_shortcut_enabled, std::sync::atomic::Ordering::Relaxed);
        engine
            .state()
            .sound_feedback
            .store(settings.sound_feedback, std::sync::atomic::Ordering::Relaxed);
    }

    if old_run_at_startup != settings.run_at_startup {
        if let Err(e) = update_startup_registry(settings.run_at_startup) {
            log::warn!("Failed to update autostart registry: {}", e);
        }
    }

    context.config_manager.save(&data)
}

#[command]
fn reset_profile_to_default(
    profile_id: String,
    context: State<'_, AppContext>,
    app: AppHandle,
) -> Result<Profile, String> {
    let default_profile = ConfigManager::get_default_profile(&profile_id)
        .ok_or_else(|| format!("Default profile for '{}' not found", profile_id))?;

    let mut data = context.data.write();
    if let Some(existing) = data.profiles.iter_mut().find(|p| p.id == profile_id) {
        *existing = default_profile.clone();
    } else {
        data.profiles.push(default_profile.clone());
    }

    // If this is the active profile, update the engine
    if data.settings.active_profile_id == profile_id {
        if let Some(engine) = context.engine.read().as_ref() {
            *engine.state().active_profile.write() = default_profile.clone();
            *engine.state().active_folder_id.write() = None;
        }
    }

    let _ = context.config_manager.save(&data);
    let _ = app.emit("profiles-updated", data.profiles.clone());
    Ok(default_profile)
}

#[command]
fn reset_all_profiles_to_default(
    context: State<'_, AppContext>,
    app: AppHandle,
) -> Result<Vec<Profile>, String> {
    let defaults = ConfigManager::get_all_default_profiles();
    let mut data = context.data.write();
    data.profiles = defaults.clone();

    let active_id = data.settings.active_profile_id.clone();
    let active_profile = data
        .profiles
        .iter()
        .find(|p| p.id == active_id)
        .cloned()
        .unwrap_or_else(|| defaults[0].clone());

    if let Some(engine) = context.engine.read().as_ref() {
        *engine.state().active_profile.write() = active_profile;
        *engine.state().active_folder_id.write() = None;
    }

    let _ = context.config_manager.save(&data);
    let _ = app.emit("profiles-updated", data.profiles.clone());
    Ok(defaults)
}

#[command]
fn save_calibration(
    calibration: CalibrationProfile,
    context: State<'_, AppContext>,
) -> Result<(), String> {
    let mut data = context.data.write();
    data.calibration = calibration.clone();

    if let Some(engine) = context.engine.read().as_ref() {
        *engine.state().calibration.write() = calibration;
    }

    context.config_manager.save(&data)
}

#[command]
fn reset_calibration_to_default(
    context: State<'_, AppContext>,
) -> Result<CalibrationProfile, String> {
    let default_cal = CalibrationProfile::standard_default();
    let mut data = context.data.write();
    data.calibration = default_cal.clone();

    if let Some(engine) = context.engine.read().as_ref() {
        *engine.state().calibration.write() = default_cal.clone();
    }

    let _ = context.config_manager.save(&data);
    Ok(default_cal)
}

#[command]
fn test_action(action: ActionConfig) -> Result<(), String> {
    ActionExecutor::execute(action)
}

#[command]
fn browse_executable_file() -> Result<Option<String>, String> {
    icons::browse_executable()
}

#[command]
fn extract_app_icon(path: String) -> Result<String, String> {
    icons::extract_icon_base64(&path)
}

#[command]
fn trigger_deck_key(key_id: String, context: State<'_, AppContext>) -> Result<(), String> {
    if let Some(engine) = context.engine.read().as_ref() {
        let state = engine.state();
        if *state.mode.read() == EngineMode::Deck {
            let profile = state.active_profile.read();
            let active_folder = state.active_folder_id.read();
            let assignment = if let Some(folder_id) = active_folder.as_ref() {
                profile
                    .folders
                    .iter()
                    .find(|f| f.id == *folder_id)
                    .and_then(|f| f.keys.get(&key_id))
                    .or_else(|| profile.keys.get(&key_id))
                    .cloned()
            } else {
                profile.keys.get(&key_id).cloned()
            };

            if let Some(assign) = assignment {
                if let Some(action) = assign.action {
                    let _ = engine.worker_tx.send(crate::keyboard::WorkerMessage::ExecuteAction {
                        key_id: key_id.clone(),
                        action,
                    });
                }
            }
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_manager = ConfigManager::new();
    let app_data = config_manager.load();

    let context = AppContext {
        engine: RwLock::new(None),
        config_manager,
        data: RwLock::new(app_data.clone()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(context)
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let app_context = app.state::<AppContext>();

            // Ensure autostart setting is synchronized
            if app_data.settings.run_at_startup {
                if let Err(e) = update_startup_registry(true) {
                    log::warn!("Initial autostart registry check failed: {}", e);
                }
            }

            // Find current active profile
            let active_id = app_data.settings.active_profile_id.clone();
            let active_profile = app_data
                .profiles
                .iter()
                .find(|p| p.id == active_id)
                .cloned()
                .unwrap_or_else(|| {
                    app_data
                        .profiles
                        .first()
                        .cloned()
                        .expect("At least one profile must exist")
                });

            // Start Authoritative WH_KEYBOARD_LL Engine
            let engine = KeyboardEngine::start(
                app_handle,
                app_data.calibration.clone(),
                active_profile,
                app_data.settings.deck_mode,
            );

            *app_context.engine.write() = Some(engine);

            // Configure System Tray
            let open_i = MenuItem::with_id(app, "open", "Open NumDeck", true, None::<&str>)?;
            let toggle_deck_i = MenuItem::with_id(app, "toggle_deck", "Toggle Deck Mode", true, None::<&str>)?;
            let exit_i = MenuItem::with_id(app, "exit", "Exit NumDeck", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&open_i, &toggle_deck_i, &exit_i])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("NumDeck")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "toggle_deck" => {
                            if let Some(context) = app.try_state::<AppContext>() {
                                let target_mode = if let Some(engine) = context.engine.read().as_ref() {
                                    let current = *engine.state().mode.read();
                                    let target = if current == EngineMode::Deck {
                                        EngineMode::Normal
                                    } else {
                                        EngineMode::Deck
                                    };
                                    *engine.state().mode.write() = target;
                                    let is_deck = target == EngineMode::Deck;
                                    let _ = app.emit("deck-mode-changed", is_deck);
                                    target
                                } else {
                                    EngineMode::Normal
                                };

                                let mut data = context.data.write();
                                data.settings.deck_mode = target_mode == EngineMode::Deck;
                                let _ = context.config_manager.save(&data);
                            }
                        }
                        "exit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _ = tray_builder.build(app)?;

            log::info!("Numpad Deck Backend initialized successfully.");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                if let Some(context) = app.try_state::<AppContext>() {
                    let minimize_to_tray = context.data.read().settings.minimize_to_tray;
                    if minimize_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    } else {
                        app.exit(0);
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_initial_data,
            get_engine_mode,
            set_engine_mode,
            get_numlock_state,
            set_active_profile,
            save_profiles,
            save_settings,
            save_calibration,
            reset_calibration_to_default,
            reset_profile_to_default,
            reset_all_profiles_to_default,
            test_action,
            browse_executable_file,
            extract_app_icon,
            trigger_deck_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
