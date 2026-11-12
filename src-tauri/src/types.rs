use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Supported physical numpad keys
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NumpadKey {
    NumLock,
    Divide,
    Multiply,
    Subtract,
    Num7,
    Num8,
    Num9,
    Plus,
    Num4,
    Num5,
    Num6,
    Num1,
    Num2,
    Num3,
    Enter,
    Num0,
    Decimal,
}

impl NumpadKey {
    pub fn display_name(&self) -> &'static str {
        match self {
            NumpadKey::NumLock => "NumLock",
            NumpadKey::Divide => "÷ (Divide)",
            NumpadKey::Multiply => "× (Multiply)",
            NumpadKey::Subtract => "- (Subtract)",
            NumpadKey::Num7 => "7 (Home)",
            NumpadKey::Num8 => "8 (Up)",
            NumpadKey::Num9 => "9 (PgUp)",
            NumpadKey::Plus => "+ (Plus)",
            NumpadKey::Num4 => "4 (Left)",
            NumpadKey::Num5 => "5 (Clear)",
            NumpadKey::Num6 => "6 (Right)",
            NumpadKey::Num1 => "1 (End)",
            NumpadKey::Num2 => "2 (Down)",
            NumpadKey::Num3 => "3 (PgDn)",
            NumpadKey::Enter => "Enter",
            NumpadKey::Num0 => "0 (Ins)",
            NumpadKey::Decimal => ". (Del)",
        }
    }

    pub fn default_label(&self) -> &'static str {
        match self {
            NumpadKey::NumLock => "NUM",
            NumpadKey::Divide => "/",
            NumpadKey::Multiply => "*",
            NumpadKey::Subtract => "-",
            NumpadKey::Num7 => "7",
            NumpadKey::Num8 => "8",
            NumpadKey::Num9 => "9",
            NumpadKey::Plus => "+",
            NumpadKey::Num4 => "4",
            NumpadKey::Num5 => "5",
            NumpadKey::Num6 => "6",
            NumpadKey::Num1 => "1",
            NumpadKey::Num2 => "2",
            NumpadKey::Num3 => "3",
            NumpadKey::Enter => "ENTER",
            NumpadKey::Num0 => "0",
            NumpadKey::Decimal => ".",
        }
    }
}

/// Action types available to be bound to a button
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
#[serde(rename_all = "snake_case")]
pub enum ActionConfig {
    None,
    LaunchApp {
        path: String,
        arguments: Vec<String>,
        working_dir: Option<String>,
    },
    OpenUrl {
        url: String,
    },
    OpenFileFolder {
        path: String,
    },
    SendHotkey {
        modifiers: Vec<String>, // "ctrl", "alt", "shift", "win"
        key: String,            // "c", "v", "f1", "tab", etc.
    },
    TypeText {
        text: String,
    },
    SystemMedia {
        command: SystemMediaCommand,
    },
    NavigateFolder {
        folder_id: String, // "__BACK__" to return
    },
    SwitchProfile {
        profile_id: String,
    },
    MultiAction {
        steps: Vec<MultiActionStep>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SystemMediaCommand {
    VolumeUp,
    VolumeDown,
    VolumeMute,
    PlayPause,
    NextTrack,
    PreviousTrack,
    LockScreen,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MultiActionStep {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub delay_ms: u64,
    pub action: ActionConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ButtonConfig {
    pub title: String,
    pub icon: String, // Lucide icon name, e.g. "Play", "Volume2", "Terminal", "Folder"
    pub custom_icon_path: Option<String>,
    pub accent_color: Option<String>, // e.g. "#3B82F6", "#10B981"
    pub action: ActionConfig,
    pub enabled: bool,
}

impl Default for ButtonConfig {
    fn default() -> Self {
        Self {
            title: String::new(),
            icon: String::new(),
            custom_icon_path: None,
            accent_color: None,
            action: ActionConfig::None,
            enabled: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DeckFolder {
    pub id: String,
    pub name: String,
    pub keys: HashMap<NumpadKey, ButtonConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub root_keys: HashMap<NumpadKey, ButtonConfig>,
    pub folders: Vec<DeckFolder>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub ctrl: bool,
    pub alt: bool,
    pub shift: bool,
    pub win: bool,
    pub key: String, // e.g. "F12"
}

impl Default for HotkeyConfig {
    fn default() -> Self {
        Self {
            ctrl: true,
            alt: true,
            shift: false,
            win: false,
            key: "F12".to_string(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppSettings {
    pub activation_hotkey: HotkeyConfig,
    pub start_with_windows: bool,
    pub minimize_to_tray: bool,
    pub default_active_state: bool,
    pub layout_type: String, // "standard_17" or "compact_18"
    pub compact_laptop_mode: bool, // Allow top-row number keys (0-9) as Deck keys
    #[serde(default)]
    pub custom_key_mappings: HashMap<String, NumpadKey>,
    pub dark_mode: bool,
    pub button_corner_radius: u32,
    pub show_labels: bool,
    pub onboarding_completed: bool,
    pub sound_feedback: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            activation_hotkey: HotkeyConfig::default(),
            start_with_windows: false,
            minimize_to_tray: true,
            default_active_state: true,
            layout_type: "standard_17".to_string(),
            compact_laptop_mode: false,
            custom_key_mappings: HashMap::new(),
            dark_mode: true,
            button_corner_radius: 12,
            show_labels: true,
            onboarding_completed: false,
            sound_feedback: true,
        }
    }
}

/// Real-time hardware keyboard event for diagnostics and manual key binding
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RawKeyEvent {
    pub vk: u32,
    pub vk_name: String,
    pub scan: u32,
    pub scan_byte: u8,
    pub is_extended: bool,
    pub is_down: bool,
    pub numlock_on: bool,
    pub mapped_key: Option<NumpadKey>,
    pub key_name: String,
    pub device_name: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DeckState {
    pub version: u32,
    pub active_profile_id: String,
    pub active_folder_id: Option<String>,
    pub is_deck_active: bool,
    pub profiles: Vec<Profile>,
    pub settings: AppSettings,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serde_keys() {
        let s = serde_json::to_string(&NumpadKey::Num7).unwrap();
        println!("Num7 serialized: {}", s);
        assert_eq!(s, "\"num7\"");
    }
}
