use crate::types::*;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const CONFIG_VERSION: u32 = 1;

pub struct ConfigManager {
    config_dir: PathBuf,
}

impl ConfigManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let config_dir = app_data_dir.join("NumpadDeck");
        let _ = fs::create_dir_all(&config_dir);
        Self { config_dir }
    }

    pub fn config_path(&self) -> PathBuf {
        self.config_dir.join("config.json")
    }

    pub fn backup_path(&self) -> PathBuf {
        self.config_dir.join("config.backup.json")
    }

    pub fn load_or_create(&self) -> DeckState {
        let path = self.config_path();
        if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => match serde_json::from_str::<DeckState>(&content) {
                    Ok(mut state) => {
                        state.version = CONFIG_VERSION;
                        return state;
                    }
                    Err(err) => {
                        eprintln!("[Config] Error parsing config.json: {err}. Trying backup...");
                        let backup = self.backup_path();
                        if backup.exists() {
                            if let Ok(b_content) = fs::read_to_string(&backup) {
                                if let Ok(state) = serde_json::from_str::<DeckState>(&b_content) {
                                    return state;
                                }
                            }
                        }
                    }
                },
                Err(err) => {
                    eprintln!("[Config] Error reading config file: {err}");
                }
            }
        }

        let default_state = self.create_default_state();
        let _ = self.save(&default_state);
        default_state
    }

    pub fn save(&self, state: &DeckState) -> Result<(), String> {
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Serialization error: {e}"))?;

        let path = self.config_path();
        let backup = self.backup_path();

        // Create backup of current file before overwriting
        if path.exists() {
            let _ = fs::copy(&path, &backup);
        }

        // Atomic write via temp file
        let temp_path = self.config_dir.join("config.tmp.json");
        fs::write(&temp_path, json).map_err(|e| format!("Failed to write temp config: {e}"))?;
        fs::rename(&temp_path, &path).map_err(|e| format!("Failed to commit config file: {e}"))?;

        Ok(())
    }

    pub fn export_to_file(&self, path: &Path, state: &DeckState) -> Result<(), String> {
        let json = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Serialization error: {e}"))?;
        fs::write(path, json).map_err(|e| format!("Failed to export config: {e}"))
    }

    pub fn import_from_file(&self, path: &Path) -> Result<DeckState, String> {
        let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {e}"))?;
        let state: DeckState =
            serde_json::from_str(&content).map_err(|e| format!("Invalid configuration JSON: {e}"))?;
        self.save(&state)?;
        Ok(state)
    }

    pub fn create_default_state(&self) -> DeckState {
        let general_profile = Self::create_general_profile();
        let streaming_profile = Self::create_streaming_profile();
        let coding_profile = Self::create_coding_profile();
        let gaming_profile = Self::create_gaming_profile();
        let editing_profile = Self::create_editing_profile();

        DeckState {
            version: CONFIG_VERSION,
            active_profile_id: general_profile.id.clone(),
            active_folder_id: None,
            is_deck_active: true,
            profiles: vec![
                general_profile,
                streaming_profile,
                coding_profile,
                gaming_profile,
                editing_profile,
            ],
            settings: AppSettings::default(),
        }
    }

    fn create_general_profile() -> Profile {
        let mut keys = HashMap::new();

        // Row 1: NumLock (Calculator), Divide (Browser), Multiply (Notepad), Subtract (Explorer)
        keys.insert(
            NumpadKey::NumLock,
            ButtonConfig {
                title: "Calc".into(),
                icon: "Calculator".into(),
                custom_icon_path: None,
                accent_color: Some("#3B82F6".into()),
                action: ActionConfig::LaunchApp {
                    path: "calc.exe".into(),
                    arguments: vec![],
                    working_dir: None,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Divide,
            ButtonConfig {
                title: "Search".into(),
                icon: "Globe".into(),
                custom_icon_path: None,
                accent_color: Some("#06B6D4".into()),
                action: ActionConfig::OpenUrl {
                    url: "https://www.google.com".into(),
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Multiply,
            ButtonConfig {
                title: "Notepad".into(),
                icon: "FileText".into(),
                custom_icon_path: None,
                accent_color: Some("#F59E0B".into()),
                action: ActionConfig::LaunchApp {
                    path: "notepad.exe".into(),
                    arguments: vec![],
                    working_dir: None,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Subtract,
            ButtonConfig {
                title: "Files".into(),
                icon: "FolderOpen".into(),
                custom_icon_path: None,
                accent_color: Some("#EC4899".into()),
                action: ActionConfig::OpenFileFolder {
                    path: "C:\\".into(),
                },
                enabled: true,
            },
        );

        // Row 2: 7 (Mute), 8 (Vol Up), 9 (Lock Screen), Plus (Play/Pause)
        keys.insert(
            NumpadKey::Num7,
            ButtonConfig {
                title: "Mute".into(),
                icon: "VolumeX".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::VolumeMute,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num8,
            ButtonConfig {
                title: "Vol +".into(),
                icon: "Volume2".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::VolumeUp,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num9,
            ButtonConfig {
                title: "Lock".into(),
                icon: "Lock".into(),
                custom_icon_path: None,
                accent_color: Some("#6366F1".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::LockScreen,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Plus,
            ButtonConfig {
                title: "Play/Pause".into(),
                icon: "Play".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::PlayPause,
                },
                enabled: true,
            },
        );

        // Row 3: 4 (Prev Track), 5 (Vol Down), 6 (Next Track)
        keys.insert(
            NumpadKey::Num4,
            ButtonConfig {
                title: "Prev".into(),
                icon: "SkipBack".into(),
                custom_icon_path: None,
                accent_color: Some("#8B5CF6".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::PreviousTrack,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num5,
            ButtonConfig {
                title: "Vol -".into(),
                icon: "Volume1".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::VolumeDown,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num6,
            ButtonConfig {
                title: "Next".into(),
                icon: "SkipForward".into(),
                custom_icon_path: None,
                accent_color: Some("#8B5CF6".into()),
                action: ActionConfig::SystemMedia {
                    command: SystemMediaCommand::NextTrack,
                },
                enabled: true,
            },
        );

        // Row 4: 1 (Media Folder), 2 (Task Manager), 3 (Screenshot), Enter (Multi-Action Morning Routine)
        keys.insert(
            NumpadKey::Num1,
            ButtonConfig {
                title: "Media".into(),
                icon: "Folder".into(),
                custom_icon_path: None,
                accent_color: Some("#F97316".into()),
                action: ActionConfig::NavigateFolder {
                    folder_id: "media_folder_1".into(),
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num2,
            ButtonConfig {
                title: "TaskMgr".into(),
                icon: "Activity".into(),
                custom_icon_path: None,
                accent_color: Some("#14B8A6".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into(), "shift".into()],
                    key: "escape".into(),
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Num3,
            ButtonConfig {
                title: "Snip".into(),
                icon: "Camera".into(),
                custom_icon_path: None,
                accent_color: Some("#06B6D4".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["win".into(), "shift".into()],
                    key: "s".into(),
                },
                enabled: true,
            },
        );

        // Multi-Action: Morning Routine (Opens Browser + Notepad + Files)
        keys.insert(
            NumpadKey::Enter,
            ButtonConfig {
                title: "Morning".into(),
                icon: "Sun".into(),
                custom_icon_path: None,
                accent_color: Some("#F59E0B".into()),
                action: ActionConfig::MultiAction {
                    steps: vec![
                        MultiActionStep {
                            id: "step_1".into(),
                            name: "Open GitHub".into(),
                            enabled: true,
                            delay_ms: 100,
                            action: ActionConfig::OpenUrl {
                                url: "https://github.com".into(),
                            },
                        },
                        MultiActionStep {
                            id: "step_2".into(),
                            name: "Open Notepad".into(),
                            enabled: true,
                            delay_ms: 300,
                            action: ActionConfig::LaunchApp {
                                path: "notepad.exe".into(),
                                arguments: vec![],
                                working_dir: None,
                            },
                        },
                    ],
                },
                enabled: true,
            },
        );

        // Row 5: 0 (Terminal / PowerShell), Decimal (Show Desktop Win+D)
        keys.insert(
            NumpadKey::Num0,
            ButtonConfig {
                title: "Terminal".into(),
                icon: "Terminal".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::LaunchApp {
                    path: "powershell.exe".into(),
                    arguments: vec![],
                    working_dir: None,
                },
                enabled: true,
            },
        );

        keys.insert(
            NumpadKey::Decimal,
            ButtonConfig {
                title: "Desktop".into(),
                icon: "Monitor".into(),
                custom_icon_path: None,
                accent_color: Some("#64748B".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["win".into()],
                    key: "d".into(),
                },
                enabled: true,
            },
        );

        // Create a subfolder for Media
        let mut folder_keys = HashMap::new();
        // Key 0 in folder is Back!
        folder_keys.insert(
            NumpadKey::NumLock,
            ButtonConfig {
                title: "Back".into(),
                icon: "CornerUpLeft".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::NavigateFolder {
                    folder_id: "__BACK__".into(),
                },
                enabled: true,
            },
        );
        folder_keys.insert(
            NumpadKey::Divide,
            ButtonConfig {
                title: "Spotify Web".into(),
                icon: "Music".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::OpenUrl {
                    url: "https://open.spotify.com".into(),
                },
                enabled: true,
            },
        );
        folder_keys.insert(
            NumpadKey::Multiply,
            ButtonConfig {
                title: "YouTube".into(),
                icon: "Video".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::OpenUrl {
                    url: "https://youtube.com".into(),
                },
                enabled: true,
            },
        );

        let media_folder = DeckFolder {
            id: "media_folder_1".into(),
            name: "Media Apps".into(),
            keys: folder_keys,
        };

        Profile {
            id: "profile_general".into(),
            name: "General".into(),
            icon: "Sliders".into(),
            color: "#3B82F6".into(),
            root_keys: keys,
            folders: vec![media_folder],
        }
    }

    fn create_streaming_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            NumpadKey::Num7,
            ButtonConfig {
                title: "Mic Mute".into(),
                icon: "MicOff".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into(), "shift".into()],
                    key: "m".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num8,
            ButtonConfig {
                title: "Deafen".into(),
                icon: "Headphones".into(),
                custom_icon_path: None,
                accent_color: Some("#8B5CF6".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into(), "shift".into()],
                    key: "d".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num9,
            ButtonConfig {
                title: "Record".into(),
                icon: "Circle".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into(), "f9".into()],
                    key: "f9".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Enter,
            ButtonConfig {
                title: "Stream Deck".into(),
                icon: "Tv".into(),
                custom_icon_path: None,
                accent_color: Some("#3B82F6".into()),
                action: ActionConfig::OpenUrl {
                    url: "https://twitch.tv".into(),
                },
                enabled: true,
            },
        );

        Profile {
            id: "profile_streaming".into(),
            name: "Streaming".into(),
            icon: "Radio".into(),
            color: "#8B5CF6".into(),
            root_keys: keys,
            folders: vec![],
        }
    }

    fn create_coding_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            NumpadKey::Num7,
            ButtonConfig {
                title: "VS Code".into(),
                icon: "Code".into(),
                custom_icon_path: None,
                accent_color: Some("#0284C7".into()),
                action: ActionConfig::LaunchApp {
                    path: "code".into(),
                    arguments: vec![],
                    working_dir: None,
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num8,
            ButtonConfig {
                title: "Terminal".into(),
                icon: "Terminal".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::LaunchApp {
                    path: "wt.exe".into(),
                    arguments: vec![],
                    working_dir: None,
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num9,
            ButtonConfig {
                title: "DevTools".into(),
                icon: "Bug".into(),
                custom_icon_path: None,
                accent_color: Some("#F59E0B".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into(), "shift".into()],
                    key: "i".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num4,
            ButtonConfig {
                title: "Git Status".into(),
                icon: "GitBranch".into(),
                custom_icon_path: None,
                accent_color: Some("#F97316".into()),
                action: ActionConfig::TypeText {
                    text: "git status\n".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num5,
            ButtonConfig {
                title: "Git Pull".into(),
                icon: "ArrowDownCircle".into(),
                custom_icon_path: None,
                accent_color: Some("#06B6D4".into()),
                action: ActionConfig::TypeText {
                    text: "git pull\n".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num6,
            ButtonConfig {
                title: "Git Push".into(),
                icon: "ArrowUpCircle".into(),
                custom_icon_path: None,
                accent_color: Some("#10B981".into()),
                action: ActionConfig::TypeText {
                    text: "git push\n".into(),
                },
                enabled: true,
            },
        );

        Profile {
            id: "profile_coding".into(),
            name: "Coding".into(),
            icon: "Terminal".into(),
            color: "#10B981".into(),
            root_keys: keys,
            folders: vec![],
        }
    }

    fn create_gaming_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            NumpadKey::Num7,
            ButtonConfig {
                title: "Discord".into(),
                icon: "MessageSquare".into(),
                custom_icon_path: None,
                accent_color: Some("#5865F2".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["shift".into()],
                    key: "f2".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num8,
            ButtonConfig {
                title: "Clip".into(),
                icon: "Film".into(),
                custom_icon_path: None,
                accent_color: Some("#EC4899".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["win".into(), "alt".into()],
                    key: "g".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num9,
            ButtonConfig {
                title: "Overlay".into(),
                icon: "Crosshair".into(),
                custom_icon_path: None,
                accent_color: Some("#EAB308".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["win".into()],
                    key: "g".into(),
                },
                enabled: true,
            },
        );

        Profile {
            id: "profile_gaming".into(),
            name: "Gaming".into(),
            icon: "Gamepad2".into(),
            color: "#E11D48".into(),
            root_keys: keys,
            folders: vec![],
        }
    }

    fn create_editing_profile() -> Profile {
        let mut keys = HashMap::new();
        keys.insert(
            NumpadKey::Num7,
            ButtonConfig {
                title: "Split/Cut".into(),
                icon: "Scissors".into(),
                custom_icon_path: None,
                accent_color: Some("#EF4444".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into()],
                    key: "k".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num8,
            ButtonConfig {
                title: "Ripple Del".into(),
                icon: "Trash2".into(),
                custom_icon_path: None,
                accent_color: Some("#F97316".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["shift".into()],
                    key: "delete".into(),
                },
                enabled: true,
            },
        );
        keys.insert(
            NumpadKey::Num9,
            ButtonConfig {
                title: "Export".into(),
                icon: "Share2".into(),
                custom_icon_path: None,
                accent_color: Some("#3B82F6".into()),
                action: ActionConfig::SendHotkey {
                    modifiers: vec!["ctrl".into()],
                    key: "m".into(),
                },
                enabled: true,
            },
        );

        Profile {
            id: "profile_editing".into(),
            name: "Editing".into(),
            icon: "Layers".into(),
            color: "#F59E0B".into(),
            root_keys: keys,
            folders: vec![],
        }
    }
}
