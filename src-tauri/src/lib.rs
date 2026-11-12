mod actions;
mod config;
mod hardware;
mod keyboard;
mod tray;
mod types;

use actions::ActionExecutor;
use config::ConfigManager;
use hardware::{HardwareDetectionReport, HardwareManager};
use keyboard::KeyboardEngine;
use parking_lot::Mutex;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State, WindowEvent};
use types::*;

pub struct AppState {
    pub config_manager: ConfigManager,
    pub deck_state: Mutex<DeckState>,
}

#[tauri::command]
fn get_state(state: State<'_, Arc<AppState>>) -> DeckState {
    let mut s = state.deck_state.lock().clone();
    s.is_deck_active = KeyboardEngine::is_deck_active();
    s
}

#[tauri::command]
fn save_state(new_state: DeckState, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let mut current = state.deck_state.lock();
    *current = new_state.clone();
    state.config_manager.save(&new_state)?;

    KeyboardEngine::set_deck_active(new_state.is_deck_active);
    KeyboardEngine::set_compact_mode(new_state.settings.compact_laptop_mode);
    KeyboardEngine::update_hotkey(new_state.settings.activation_hotkey);

    Ok(())
}

#[tauri::command]
fn toggle_numlock() -> bool {
    KeyboardEngine::toggle_numlock()
}

#[tauri::command]
fn toggle_deck_mode(state: State<'_, Arc<AppState>>) -> bool {
    let new_mode = KeyboardEngine::toggle_deck_active();
    let mut s = state.deck_state.lock();
    s.is_deck_active = new_mode;
    let _ = state.config_manager.save(&s);
    new_mode
}

#[tauri::command]
fn set_deck_mode(active: bool, state: State<'_, Arc<AppState>>) -> bool {
    KeyboardEngine::set_deck_active(active);
    let mut s = state.deck_state.lock();
    s.is_deck_active = active;
    let _ = state.config_manager.save(&s);
    active
}

#[tauri::command]
fn set_active_profile(profile_id: String, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let mut s = state.deck_state.lock();
    if s.profiles.iter().any(|p| p.id == profile_id) {
        s.active_profile_id = profile_id;
        s.active_folder_id = None;
        let _ = state.config_manager.save(&s);
        Ok(())
    } else {
        Err(format!("Profile '{profile_id}' not found"))
    }
}

#[tauri::command]
fn set_active_folder(folder_id: Option<String>, state: State<'_, Arc<AppState>>) {
    let mut s = state.deck_state.lock();
    s.active_folder_id = folder_id;
    let _ = state.config_manager.save(&s);
}

#[tauri::command]
async fn execute_button_action(action: ActionConfig) -> Result<(), String> {
    ActionExecutor::execute(&action).await
}

#[tauri::command]
fn set_test_mode(enabled: bool) {
    KeyboardEngine::set_test_mode(enabled);
}

#[tauri::command]
fn detect_hardware() -> HardwareDetectionReport {
    HardwareManager::detect_hardware()
}

#[tauri::command]
fn export_config(path: String, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let s = state.deck_state.lock();
    state.config_manager.export_to_file(std::path::Path::new(&path), &s)
}

#[tauri::command]
fn import_config(path: String, state: State<'_, Arc<AppState>>) -> Result<DeckState, String> {
    let loaded = state.config_manager.import_from_file(std::path::Path::new(&path))?;
    let mut s = state.deck_state.lock();
    *s = loaded.clone();
    KeyboardEngine::set_deck_active(loaded.is_deck_active);
    KeyboardEngine::update_hotkey(loaded.settings.activation_hotkey.clone());
    Ok(loaded)
}

#[tauri::command]
fn reset_config(state: State<'_, Arc<AppState>>) -> DeckState {
    let default = state.config_manager.create_default_state();
    let mut s = state.deck_state.lock();
    *s = default.clone();
    let _ = state.config_manager.save(&default);
    KeyboardEngine::set_deck_active(default.is_deck_active);
    KeyboardEngine::update_hotkey(default.settings.activation_hotkey.clone());
    default
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("data"));

            let config_mgr = ConfigManager::new(app_data_dir);
            let initial_state = config_mgr.load_or_create();

            let is_deck_active = initial_state.is_deck_active;
            let hotkey = initial_state.settings.activation_hotkey.clone();
            KeyboardEngine::set_compact_mode(initial_state.settings.compact_laptop_mode);

            let app_state = Arc::new(AppState {
                config_manager: config_mgr,
                deck_state: Mutex::new(initial_state),
            });

            app.manage(app_state.clone());

            // Initialize keyboard hook engine
            let app_handle = app.handle().clone();
            let state_for_keys = app_state.clone();
            let handle_for_nav = app.handle().clone();

            KeyboardEngine::init(app_handle, is_deck_active, hotkey, move |key| {
                let state_guard = state_for_keys.deck_state.lock();
                let active_profile = state_guard
                    .profiles
                    .iter()
                    .find(|p| p.id == state_guard.active_profile_id);

                if let Some(profile) = active_profile {
                    let maybe_button = if let Some(ref folder_id) = state_guard.active_folder_id {
                        profile
                            .folders
                            .iter()
                            .find(|f| &f.id == folder_id)
                            .and_then(|f| f.keys.get(&key))
                    } else {
                        profile.root_keys.get(&key)
                    };

                    if let Some(btn) = maybe_button {
                        if btn.enabled && btn.action != ActionConfig::None {
                            let action = btn.action.clone();
                            drop(state_guard);
                            match action {
                                ActionConfig::NavigateFolder { folder_id } => {
                                    let new_folder = if folder_id == "__BACK__" {
                                        None
                                    } else {
                                        Some(folder_id)
                                    };
                                    let mut s = state_for_keys.deck_state.lock();
                                    s.active_folder_id = new_folder.clone();
                                    let _ = state_for_keys.config_manager.save(&s);
                                    let _ = handle_for_nav.emit("active-folder-changed", new_folder);
                                }
                                ActionConfig::SwitchProfile { profile_id } => {
                                    let mut s = state_for_keys.deck_state.lock();
                                    s.active_profile_id = profile_id.clone();
                                    s.active_folder_id = None;
                                    let _ = state_for_keys.config_manager.save(&s);
                                    let _ = handle_for_nav.emit("active-profile-changed", profile_id);
                                }
                                action_to_run => {
                                    tokio::spawn(async move {
                                        if let Err(e) = ActionExecutor::execute(&action_to_run).await
                                        {
                                            eprintln!("[Executor] Action execution error: {e}");
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            // Set up system tray
            let _ = tray::setup_tray(app.handle());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // If minimize_to_tray is true, hide window instead of exiting
                let app = window.app_handle();
                if let Some(state) = app.try_state::<Arc<AppState>>() {
                    let s = state.deck_state.lock();
                    if s.settings.minimize_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    } else {
                        KeyboardEngine::shutdown();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            save_state,
            toggle_deck_mode,
            set_deck_mode,
            set_active_profile,
            set_active_folder,
            execute_button_action,
            set_test_mode,
            detect_hardware,
            toggle_numlock,
            export_config,
            import_config,
            reset_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
