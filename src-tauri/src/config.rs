use crate::types::*;
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;

pub struct ConfigManager {
    config_path: PathBuf,
    backup_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let app_dir = Self::get_app_dir();
        fs::create_dir_all(&app_dir).ok();
        Self {
            config_path: app_dir.join("config.json"),
            backup_path: app_dir.join("config.json.bak"),
        }
    }

    fn get_app_dir() -> PathBuf {
        if let Ok(appdata) = std::env::var("APPDATA") {
            PathBuf::from(appdata).join("NumpadDeck")
        } else {
            PathBuf::from(".config").join("numpad-deck")
        }
    }

    /// Load application data, or create defaults if missing or corrupted
    pub fn load(&self) -> AppData {
        if self.config_path.exists() {
            match fs::read_to_string(&self.config_path) {
                Ok(content) => match serde_json::from_str::<AppData>(&content) {
                    Ok(data) => return data,
                    Err(e) => {
                        log::error!("Failed to parse config: {}. Attempting backup...", e);
                        if self.backup_path.exists() {
                            if let Ok(bak_content) = fs::read_to_string(&self.backup_path) {
                                if let Ok(data) = serde_json::from_str::<AppData>(&bak_content) {
                                    log::info!("Successfully restored from backup.");
                                    return data;
                                }
                            }
                        }
                    }
                },
                Err(e) => {
                    log::error!("Failed to read config file: {}", e);
                }
            }
        }

        // Return default data
        let default_data = Self::create_default_data();
        let _ = self.save(&default_data);
        default_data
    }

    /// Atomically save application data
    pub fn save(&self, data: &AppData) -> Result<(), String> {
        let json = serde_json::to_string_pretty(data)
            .map_err(|e| format!("Serialization error: {}", e))?;

        let temp_path = self.config_path.with_extension("tmp");

        // Write to temporary file
        let mut file = File::create(&temp_path)
            .map_err(|e| format!("Failed to create temp config: {}", e))?;
        file.write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write config: {}", e))?;
        file.sync_all()
            .map_err(|e| format!("Failed to sync config: {}", e))?;
        drop(file);

        // If current config exists, copy to backup
        if self.config_path.exists() {
            let _ = fs::copy(&self.config_path, &self.backup_path);
        }

        // Atomically replace target file
        fs::rename(&temp_path, &self.config_path)
            .map_err(|e| format!("Failed to atomically rename config: {}", e))?;

        Ok(())
    }

    /// Generate initial standard profiles
    pub fn create_default_data() -> AppData {
        let profiles = vec![
            Self::create_general_profile(),
            Self::create_gaming_profile(),
            Self::create_coding_profile(),
            Self::create_editing_profile(),
            Self::create_streaming_profile(),
        ];

        AppData {
            version: 1,
            settings: AppSettings::default(),
            calibration: CalibrationProfile::standard_default(),
            profiles,
        }
    }

    fn create_general_profile() -> Profile {
        let mut keys = HashMap::new();

        keys.insert(
            "numpad_numlock".to_string(),
            KeyAssignment {
                key_id: "numpad_numlock".to_string(),
                label: "Deck Toggle".to_string(),
                icon: "Power".to_string(),
                color: Some("#397BFF".to_string()),
                action: Some(ActionConfig::ToggleDeckMode),
            },
        );

        keys.insert(
            "numpad_divide".to_string(),
            KeyAssignment {
                key_id: "numpad_divide".to_string(),
                label: "Mute Audio".to_string(),
                icon: "VolumeX".to_string(),
                color: Some("#ED7777".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "mute".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_multiply".to_string(),
            KeyAssignment {
                key_id: "numpad_multiply".to_string(),
                label: "Play / Pause".to_string(),
                icon: "PlayPause".to_string(),
                color: Some("#65C991".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "play_pause".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_subtract".to_string(),
            KeyAssignment {
                key_id: "numpad_subtract".to_string(),
                label: "Volume Down".to_string(),
                icon: "Volume1".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "volume_down".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_add".to_string(),
            KeyAssignment {
                key_id: "numpad_add".to_string(),
                label: "Volume Up".to_string(),
                icon: "Volume2".to_string(),
                color: Some("#397BFF".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "volume_up".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_7".to_string(),
            KeyAssignment {
                key_id: "numpad_7".to_string(),
                label: "Chrome".to_string(),
                icon: "chrome".to_string(),
                color: Some("#4285F4".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "https://www.google.com".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_8".to_string(),
            KeyAssignment {
                key_id: "numpad_8".to_string(),
                label: "Calculator".to_string(),
                icon: "Calculator".to_string(),
                color: Some("#E9B86A".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "calc.exe".to_string(),
                    arguments: None,
                }),
            },
        );

        keys.insert(
            "numpad_9".to_string(),
            KeyAssignment {
                key_id: "numpad_9".to_string(),
                label: "Notepad".to_string(),
                icon: "notepad".to_string(),
                color: Some("#0078D7".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "notepad.exe".to_string(),
                    arguments: None,
                }),
            },
        );

        keys.insert(
            "numpad_4".to_string(),
            KeyAssignment {
                key_id: "numpad_4".to_string(),
                label: "Prev Track".to_string(),
                icon: "SkipBack".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "prev_track".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_5".to_string(),
            KeyAssignment {
                key_id: "numpad_5".to_string(),
                label: "Explorer".to_string(),
                icon: "explorer".to_string(),
                color: Some("#FFA000".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "explorer.exe".to_string(),
                    arguments: None,
                }),
            },
        );

        keys.insert(
            "numpad_6".to_string(),
            KeyAssignment {
                key_id: "numpad_6".to_string(),
                label: "Next Track".to_string(),
                icon: "SkipForward".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::SystemMedia {
                    command: "next_track".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_1".to_string(),
            KeyAssignment {
                key_id: "numpad_1".to_string(),
                label: "Screenshot".to_string(),
                icon: "Camera".to_string(),
                color: Some("#397BFF".to_string()),
                action: Some(ActionConfig::Hotkey {
                    modifiers: vec!["win".to_string(), "shift".to_string()],
                    key: "S".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_2".to_string(),
            KeyAssignment {
                key_id: "numpad_2".to_string(),
                label: "Task Manager".to_string(),
                icon: "Activity".to_string(),
                color: Some("#ED7777".to_string()),
                action: Some(ActionConfig::Hotkey {
                    modifiers: vec!["ctrl".to_string(), "shift".to_string()],
                    key: "ESCAPE".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_3".to_string(),
            KeyAssignment {
                key_id: "numpad_3".to_string(),
                label: "Lock Screen".to_string(),
                icon: "Lock".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::Hotkey {
                    modifiers: vec!["win".to_string()],
                    key: "L".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_0".to_string(),
            KeyAssignment {
                key_id: "numpad_0".to_string(),
                label: "Paste Template".to_string(),
                icon: "Clipboard".to_string(),
                color: Some("#65C991".to_string()),
                action: Some(ActionConfig::TypeText {
                    text: "Thank you for contacting support! How can I help you today?".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_decimal".to_string(),
            KeyAssignment {
                key_id: "numpad_decimal".to_string(),
                label: "Settings".to_string(),
                icon: "Settings".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::Hotkey {
                    modifiers: vec!["win".to_string()],
                    key: "I".to_string(),
                }),
            },
        );

        keys.insert(
            "numpad_enter".to_string(),
            KeyAssignment {
                key_id: "numpad_enter".to_string(),
                label: "Terminal".to_string(),
                icon: "terminal".to_string(),
                color: Some("#4EC9B0".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "wt.exe".to_string(),
                    arguments: None,
                }),
            },
        );

        Profile {
            id: "general".to_string(),
            name: "General".to_string(),
            icon: "LayoutGrid".to_string(),
            keys,
            folders: vec![],
            app_association: None,
        }
    }

    fn create_gaming_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            "numpad_7".to_string(),
            KeyAssignment {
                key_id: "numpad_7".to_string(),
                label: "Discord".to_string(),
                icon: "discord".to_string(),
                color: Some("#5865F2".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "discord://".to_string(),
                }),
            },
        );
        keys.insert(
            "numpad_8".to_string(),
            KeyAssignment {
                key_id: "numpad_8".to_string(),
                label: "Steam".to_string(),
                icon: "steam".to_string(),
                color: Some("#1999D4".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "steam://open/main".to_string(),
                }),
            },
        );
        keys.insert(
            "numpad_9".to_string(),
            KeyAssignment {
                key_id: "numpad_9".to_string(),
                label: "OBS Studio".to_string(),
                icon: "obs".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "obs64.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_4".to_string(),
            KeyAssignment {
                key_id: "numpad_4".to_string(),
                label: "Spotify".to_string(),
                icon: "spotify".to_string(),
                color: Some("#1DB954".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "spotify:".to_string(),
                }),
            },
        );

        Profile {
            id: "gaming".to_string(),
            name: "Gaming".to_string(),
            icon: "Gamepad2".to_string(),
            keys,
            folders: vec![],
            app_association: Some("steam.exe".to_string()),
        }
    }

    fn create_coding_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            "numpad_7".to_string(),
            KeyAssignment {
                key_id: "numpad_7".to_string(),
                label: "VS Code".to_string(),
                icon: "vscode".to_string(),
                color: Some("#007ACC".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "code".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_8".to_string(),
            KeyAssignment {
                key_id: "numpad_8".to_string(),
                label: "Terminal".to_string(),
                icon: "terminal".to_string(),
                color: Some("#4EC9B0".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "wt.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_9".to_string(),
            KeyAssignment {
                key_id: "numpad_9".to_string(),
                label: "Visual Studio".to_string(),
                icon: "visualstudio".to_string(),
                color: Some("#865FC5".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "devenv.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_5".to_string(),
            KeyAssignment {
                key_id: "numpad_5".to_string(),
                label: "Firefox Dev".to_string(),
                icon: "firefox".to_string(),
                color: Some("#FF7139".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "https://localhost:3000".to_string(),
                }),
            },
        );

        Profile {
            id: "coding".to_string(),
            name: "Coding".to_string(),
            icon: "Code".to_string(),
            keys,
            folders: vec![],
            app_association: Some("code.cmd".to_string()),
        }
    }

    fn create_editing_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            "numpad_7".to_string(),
            KeyAssignment {
                key_id: "numpad_7".to_string(),
                label: "Photoshop".to_string(),
                icon: "photoshop".to_string(),
                color: Some("#31A8FF".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "Photoshop.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_8".to_string(),
            KeyAssignment {
                key_id: "numpad_8".to_string(),
                label: "Premiere".to_string(),
                icon: "premiere".to_string(),
                color: Some("#EA77FF".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "Adobe Premiere Pro.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_9".to_string(),
            KeyAssignment {
                key_id: "numpad_9".to_string(),
                label: "Blender".to_string(),
                icon: "blender".to_string(),
                color: Some("#EA7600".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "blender.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_5".to_string(),
            KeyAssignment {
                key_id: "numpad_5".to_string(),
                label: "VLC Player".to_string(),
                icon: "vlc".to_string(),
                color: Some("#FF7800".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "vlc.exe".to_string(),
                    arguments: None,
                }),
            },
        );

        Profile {
            id: "editing".to_string(),
            name: "Editing".to_string(),
            icon: "Film".to_string(),
            keys,
            folders: vec![],
            app_association: Some("Photoshop.exe".to_string()),
        }
    }

    fn create_streaming_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            "numpad_7".to_string(),
            KeyAssignment {
                key_id: "numpad_7".to_string(),
                label: "OBS Studio".to_string(),
                icon: "obs".to_string(),
                color: Some("#929CAC".to_string()),
                action: Some(ActionConfig::LaunchApp {
                    path: "obs64.exe".to_string(),
                    arguments: None,
                }),
            },
        );
        keys.insert(
            "numpad_8".to_string(),
            KeyAssignment {
                key_id: "numpad_8".to_string(),
                label: "Discord".to_string(),
                icon: "discord".to_string(),
                color: Some("#5865F2".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "discord://".to_string(),
                }),
            },
        );
        keys.insert(
            "numpad_9".to_string(),
            KeyAssignment {
                key_id: "numpad_9".to_string(),
                label: "Spotify".to_string(),
                icon: "spotify".to_string(),
                color: Some("#1DB954".to_string()),
                action: Some(ActionConfig::OpenPath {
                    path: "spotify:".to_string(),
                }),
            },
        );

        Profile {
            id: "streaming".to_string(),
            name: "Streaming".to_string(),
            icon: "Tv".to_string(),
            keys,
            folders: vec![],
            app_association: Some("obs64.exe".to_string()),
        }
    }
}
#[cfg(test)]
mod config_tests {
    use super::*;

    #[test]
    fn test_default_profiles_exist() {
        let data = ConfigManager::create_default_data();
        assert_eq!(data.profiles.len(), 5);
        let ids: Vec<&str> = data.profiles.iter().map(|p| p.id.as_str()).collect();
        assert!(ids.contains(&"general"));
        assert!(ids.contains(&"gaming"));
        assert!(ids.contains(&"coding"));
        assert!(ids.contains(&"editing"));
        assert!(ids.contains(&"streaming"));

        let general = data.profiles.iter().find(|p| p.id == "general").unwrap();
        assert!(general.keys.contains_key("numpad_7"));
        assert!(general.keys.contains_key("numpad_enter"));
    }

    #[test]
    fn test_action_config_serialization() {
        let action = ActionConfig::MultiAction {
            steps: vec![
                ActionStep {
                    action: ActionConfig::SystemMedia {
                        command: "play_pause".to_string(),
                    },
                    delay_ms: 100,
                },
                ActionStep {
                    action: ActionConfig::TypeText {
                        text: "hello".to_string(),
                    },
                    delay_ms: 50,
                },
            ],
        };

        let json = serde_json::to_string(&action).unwrap();
        let deserialized: ActionConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(action, deserialized);
    }
}
