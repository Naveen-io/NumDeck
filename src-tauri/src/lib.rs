pub mod actions;
pub mod config;
pub mod icons;
pub mod keyboard;
pub mod types;

use actions::ActionExecutor;
use config::ConfigManager;
use keyboard::KeyboardEngine;
use parking_lot::RwLock;
use tauri::{command, AppHandle, Emitter, Manager, State};
use types::*;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

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
        let is_deck = mode == EngineMode::Deck;
        let _ = app.emit("deck-mode-changed", is_deck);
        log::info!("Engine mode set to: {:?}", mode);
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

    context.config_manager.save(&data)
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
            );

            *app_context.engine.write() = Some(engine);
            log::info!("Numpad Deck Backend initialized successfully.");
            Ok(())
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
            test_action,
            browse_executable_file,
            extract_app_icon
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
