use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Identifiers for the standard 17-key numeric keypad
pub const ALL_NUMPAD_KEYS: &[&str] = &[
    "numpad_numlock",
    "numpad_divide",
    "numpad_multiply",
    "numpad_subtract",
    "numpad_7",
    "numpad_8",
    "numpad_9",
    "numpad_add",
    "numpad_4",
    "numpad_5",
    "numpad_6",
    "numpad_1",
    "numpad_2",
    "numpad_3",
    "numpad_enter",
    "numpad_0",
    "numpad_decimal",
];

/// Physical hardware signature of a key captured from KBDLLHOOKSTRUCT
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct KeySignature {
    pub vk_code: u32,
    pub scan_code: u32,
    pub is_extended: bool,
}

impl KeySignature {
    pub fn new(vk_code: u32, scan_code: u32, is_extended: bool) -> Self {
        Self {
            vk_code,
            scan_code,
            is_extended,
        }
    }

    /// Check if this incoming hardware event matches this calibrated signature.
    /// Hardware scan code + extended bit defines physical key position on Windows.
    pub fn matches_hardware(&self, scan_code: u32, is_extended: bool) -> bool {
        self.scan_code == scan_code && self.is_extended == is_extended
    }

    /// Formatted display string for debugging and UI
    pub fn display_summary(&self) -> String {
        format!(
            "VK: 0x{:02X} | Scan: 0x{:02X} | Ext: {}",
            self.vk_code,
            self.scan_code,
            if self.is_extended { 1 } else { 0 }
        )
    }
}

/// Operational Mode of Numpad Deck
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EngineMode {
    Normal,
    Deck,
    Calibrating,
}

/// Live Diagnostic Event sent from Low-Level Hook to UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticEvent {
    pub timestamp: u64,
    pub event_type: String, // "keydown" | "keyup"
    pub vk_code: u32,
    pub vk_name: String,
    pub scan_code: u32,
    pub is_extended: bool,
    pub is_injected: bool,
    pub numlock_on: bool,
    pub is_suppressed: bool,
    pub matched_logical_key: Option<String>,
}

/// Calibration state and captured signatures per logical key
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalibrationProfile {
    pub signatures: HashMap<String, Vec<KeySignature>>,
    pub calibrated_at: Option<String>,
    pub is_completed: bool,
}

impl CalibrationProfile {
    /// Return default fallback signatures based on standard PC keyboard architecture
    pub fn standard_default() -> Self {
        let mut signatures = HashMap::new();
        // NumLock (Scan 0x45, Ext: 0)
        signatures.insert(
            "numpad_numlock".to_string(),
            vec![KeySignature::new(0x90, 0x45, false)],
        );
        // Divide / (Scan 0x35, Ext: 1)
        signatures.insert(
            "numpad_divide".to_string(),
            vec![KeySignature::new(0x6F, 0x35, true)],
        );
        // Multiply * (Scan 0x37, Ext: 0)
        signatures.insert(
            "numpad_multiply".to_string(),
            vec![KeySignature::new(0x6A, 0x37, false)],
        );
        // Subtract - (Scan 0x4A, Ext: 0)
        signatures.insert(
            "numpad_subtract".to_string(),
            vec![KeySignature::new(0x6D, 0x4A, false)],
        );
        // Add + (Scan 0x4E, Ext: 0)
        signatures.insert(
            "numpad_add".to_string(),
            vec![KeySignature::new(0x6B, 0x4E, false)],
        );
        // Numpad Enter (Scan 0x1C, Ext: 1) -- Distinguishes from Main Enter (Ext: 0)
        signatures.insert(
            "numpad_enter".to_string(),
            vec![KeySignature::new(0x0D, 0x1C, true)],
        );
        // 7 / Home (Scan 0x47, Ext: 0) -- Distinguishes from Dedicated Home (Ext: 1)
        signatures.insert(
            "numpad_7".to_string(),
            vec![
                KeySignature::new(0x67, 0x47, false), // NumLock ON
                KeySignature::new(0x24, 0x47, false), // NumLock OFF (VK_HOME)
            ],
        );
        // 8 / Up (Scan 0x48, Ext: 0) -- Distinguishes from Dedicated Up (Ext: 1)
        signatures.insert(
            "numpad_8".to_string(),
            vec![
                KeySignature::new(0x68, 0x48, false), // NumLock ON
                KeySignature::new(0x26, 0x48, false), // NumLock OFF (VK_UP)
            ],
        );
        // 9 / PgUp (Scan 0x49, Ext: 0) -- Distinguishes from Dedicated PgUp (Ext: 1)
        signatures.insert(
            "numpad_9".to_string(),
            vec![
                KeySignature::new(0x69, 0x49, false),
                KeySignature::new(0x21, 0x49, false),
            ],
        );
        // 4 / Left (Scan 0x4B, Ext: 0) -- Distinguishes from Dedicated Left (Ext: 1)
        signatures.insert(
            "numpad_4".to_string(),
            vec![
                KeySignature::new(0x64, 0x4B, false),
                KeySignature::new(0x25, 0x4B, false),
            ],
        );
        // 5 / Clear (Scan 0x4C, Ext: 0)
        signatures.insert(
            "numpad_5".to_string(),
            vec![
                KeySignature::new(0x65, 0x4C, false),
                KeySignature::new(0x0C, 0x4C, false),
            ],
        );
        // 6 / Right (Scan 0x4D, Ext: 0) -- Distinguishes from Dedicated Right (Ext: 1)
        signatures.insert(
            "numpad_6".to_string(),
            vec![
                KeySignature::new(0x66, 0x4D, false),
                KeySignature::new(0x27, 0x4D, false),
            ],
        );
        // 1 / End (Scan 0x4F, Ext: 0) -- Distinguishes from Dedicated End (Ext: 1)
        signatures.insert(
            "numpad_1".to_string(),
            vec![
                KeySignature::new(0x61, 0x4F, false),
                KeySignature::new(0x23, 0x4F, false),
            ],
        );
        // 2 / Down (Scan 0x50, Ext: 0) -- Distinguishes from Dedicated Down (Ext: 1)
        signatures.insert(
            "numpad_2".to_string(),
            vec![
                KeySignature::new(0x62, 0x50, false),
                KeySignature::new(0x28, 0x50, false),
            ],
        );
        // 3 / PgDn (Scan 0x51, Ext: 0) -- Distinguishes from Dedicated PgDn (Ext: 1)
        signatures.insert(
            "numpad_3".to_string(),
            vec![
                KeySignature::new(0x63, 0x51, false),
                KeySignature::new(0x22, 0x51, false),
            ],
        );
        // 0 / Ins (Scan 0x52, Ext: 0) -- Distinguishes from Dedicated Ins (Ext: 1)
        signatures.insert(
            "numpad_0".to_string(),
            vec![
                KeySignature::new(0x60, 0x52, false),
                KeySignature::new(0x2D, 0x52, false),
            ],
        );
        // Decimal / Del (Scan 0x53, Ext: 0) -- Distinguishes from Dedicated Del (Ext: 1)
        signatures.insert(
            "numpad_decimal".to_string(),
            vec![
                KeySignature::new(0x6E, 0x53, false),
                KeySignature::new(0x2E, 0x53, false),
            ],
        );

        Self {
            signatures,
            calibrated_at: None,
            is_completed: false,
        }
    }

    /// Match an incoming physical key event against calibrated keys.
    /// Returns the logical key id if matched.
    pub fn find_matched_key(&self, _vk_code: u32, scan_code: u32, is_extended: bool) -> Option<String> {
        for (key_id, sigs) in &self.signatures {
            for sig in sigs {
                // Primary check: scan code + extended bit must match
                if sig.matches_hardware(scan_code, is_extended) {
                    // Secondary check: if vk_code is also recorded, ensure it matches either recorded vk
                    // or allow if scan code uniquely maps to numpad
                    return Some(key_id.clone());
                }
            }
        }
        None
    }
}

/// Action types supported by Numpad Deck
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "payload")]
pub enum ActionConfig {
    LaunchApp {
        path: String,
        arguments: Option<String>,
    },
    OpenPath {
        path: String, // file, folder, or URL
    },
    Hotkey {
        modifiers: Vec<String>, // "ctrl", "alt", "shift", "win"
        key: String,
    },
    TypeText {
        text: String,
    },
    SystemMedia {
        command: String, // "volume_up", "volume_down", "mute", "play_pause", "next_track", "prev_track"
    },
    MultiAction {
        steps: Vec<ActionStep>,
    },
    SwitchProfile {
        profile_id: String,
    },
    NavigateFolder {
        folder_id: String,
    },
    BackToRootFolder,
    ToggleDeckMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ActionStep {
    pub action: ActionConfig,
    pub delay_ms: u64,
}

/// Visual and execution binding for a single key on the Deck
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct KeyAssignment {
    pub key_id: String,
    pub label: String,
    pub icon: String,
    pub color: Option<String>,
    pub action: Option<ActionConfig>,
}

/// Folder or page inside a Deck profile
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DeckFolder {
    pub id: String,
    pub name: String,
    pub keys: HashMap<String, KeyAssignment>,
}

/// User profile containing key assignments
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub keys: HashMap<String, KeyAssignment>,
    pub folders: Vec<DeckFolder>,
}

/// Global Application Settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub deck_mode: bool,
    pub active_profile_id: String,
    pub active_folder_id: Option<String>,
    pub emergency_shortcut_enabled: bool,
    pub sound_feedback: bool,
    pub run_at_startup: bool,
    pub minimize_to_tray: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            deck_mode: false,
            active_profile_id: "general".to_string(),
            active_folder_id: None,
            emergency_shortcut_enabled: true,
            sound_feedback: true,
            run_at_startup: false,
            minimize_to_tray: false,
        }
    }
}

/// Complete Persistent State saved to disk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppData {
    pub version: u32,
    pub settings: AppSettings,
    pub calibration: CalibrationProfile,
    pub profiles: Vec<Profile>,
}

/// Core suppression and routing decision produced by the low-level hook pipeline
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HookDecision {
    SuppressAndExecute,
    SuppressOnly,
    PassThrough,
}

/// Pure decision function mirroring low_level_keyboard_proc logic for regression testing
pub fn evaluate_key_event(
    mode: EngineMode,
    cal: &CalibrationProfile,
    pressed_keys: &mut std::collections::HashSet<String>,
    vk_code: u32,
    scan_code: u32,
    is_extended: bool,
    is_injected: bool,
    is_key_down: bool,
) -> (HookDecision, Option<String>) {
    if is_injected {
        return (HookDecision::PassThrough, None);
    }
    match mode {
        EngineMode::Calibrating => (HookDecision::SuppressOnly, None),
        EngineMode::Deck => {
            if let Some(key_id) = cal.find_matched_key(vk_code, scan_code, is_extended) {
                if is_key_down {
                    let first = pressed_keys.insert(key_id.clone());
                    if first {
                        (HookDecision::SuppressAndExecute, Some(key_id))
                    } else {
                        (HookDecision::SuppressOnly, Some(key_id))
                    }
                } else {
                    pressed_keys.remove(&key_id);
                    (HookDecision::SuppressOnly, Some(key_id))
                }
            } else {
                (HookDecision::PassThrough, None)
            }
        }
        EngineMode::Normal => (HookDecision::PassThrough, None),
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_numpad_vs_top_row_numbers() {
        let cal = CalibrationProfile::standard_default();

        // Numpad 7 (Scan: 0x47, Ext: false)
        assert_eq!(cal.find_matched_key(0x67, 0x47, false), Some("numpad_7".to_string()));

        // Top-row number 7 (VK: 0x37, Scan: 0x08, Ext: false)
        assert_eq!(cal.find_matched_key(0x37, 0x08, false), None);

        // Top-row number 1 (VK: 0x31, Scan: 0x02, Ext: false)
        assert_eq!(cal.find_matched_key(0x31, 0x02, false), None);

        // Top-row number 0 (VK: 0x30, Scan: 0x0B, Ext: false)
        assert_eq!(cal.find_matched_key(0x30, 0x0B, false), None);
    }

    #[test]
    fn test_main_enter_vs_numpad_enter() {
        let cal = CalibrationProfile::standard_default();

        // Main keyboard Enter: Scan 0x1C, is_extended = false
        assert_eq!(cal.find_matched_key(0x0D, 0x1C, false), None);

        // Numpad Enter: Scan 0x1C, is_extended = true
        assert_eq!(cal.find_matched_key(0x0D, 0x1C, true), Some("numpad_enter".to_string()));
    }

    #[test]
    fn test_dedicated_nav_keys_vs_numpad_nav_keys_when_numlock_off() {
        let cal = CalibrationProfile::standard_default();

        // Dedicated Home key on navigation cluster: Scan 0x47, is_extended = true
        assert_eq!(cal.find_matched_key(0x24, 0x47, true), None);

        // Numpad 7 acting as Home when NumLock is OFF: Scan 0x47, is_extended = false
        assert_eq!(cal.find_matched_key(0x24, 0x47, false), Some("numpad_7".to_string()));

        // Dedicated Up arrow on navigation cluster: Scan 0x48, is_extended = true
        assert_eq!(cal.find_matched_key(0x26, 0x48, true), None);

        // Numpad 8 acting as Up when NumLock is OFF: Scan 0x48, is_extended = false
        assert_eq!(cal.find_matched_key(0x26, 0x48, false), Some("numpad_8".to_string()));

        // Dedicated Page Up: Scan 0x49, is_extended = true
        assert_eq!(cal.find_matched_key(0x21, 0x49, true), None);

        // Numpad 9 acting as PgUp: Scan 0x49, is_extended = false
        assert_eq!(cal.find_matched_key(0x21, 0x49, false), Some("numpad_9".to_string()));
    }

    #[test]
    fn test_numlock_on_and_off_both_match_same_physical_key() {
        let cal = CalibrationProfile::standard_default();

        // Numpad 1 with NumLock ON: VK_NUMPAD1 (0x61), Scan 0x4F, Ext: false
        assert_eq!(cal.find_matched_key(0x61, 0x4F, false), Some("numpad_1".to_string()));

        // Numpad 1 with NumLock OFF: VK_END (0x23), Scan 0x4F, Ext: false
        assert_eq!(cal.find_matched_key(0x23, 0x4F, false), Some("numpad_1".to_string()));

        // Numpad 0 with NumLock ON: VK_NUMPAD0 (0x60), Scan 0x52, Ext: false
        assert_eq!(cal.find_matched_key(0x60, 0x52, false), Some("numpad_0".to_string()));

        // Numpad 0 with NumLock OFF: VK_INSERT (0x2D), Scan 0x52, Ext: false
        assert_eq!(cal.find_matched_key(0x2D, 0x52, false), Some("numpad_0".to_string()));
    }

    #[test]
    fn test_custom_calibrated_signature() {
        let mut cal = CalibrationProfile::default();
        // Suppose user has a laptop where Numpad 7 emits custom scan code 0x88 with is_extended = false
        cal.signatures.insert(
            "numpad_7".to_string(),
            vec![KeySignature::new(0x67, 0x88, false)],
        );

        assert_eq!(cal.find_matched_key(0x67, 0x88, false), Some("numpad_7".to_string()));
        assert_eq!(cal.find_matched_key(0x67, 0x47, false), None);
    }

    #[test]
    fn test_regression_deck_mode_on_suppresses_and_executes() {
        let cal = CalibrationProfile::standard_default();
        let mut pressed = std::collections::HashSet::new();

        // Numpad 7 Key Down: Must SuppressAndExecute
        let (decision, key) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x67,
            0x47,
            false,
            false,
            true,
        );
        assert_eq!(decision, HookDecision::SuppressAndExecute);
        assert_eq!(key, Some("numpad_7".to_string()));

        // Numpad 7 Key Repeat (held down): Must SuppressOnly (no duplicate action)
        let (decision_repeat, key_repeat) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x67,
            0x47,
            false,
            false,
            true,
        );
        assert_eq!(decision_repeat, HookDecision::SuppressOnly);
        assert_eq!(key_repeat, Some("numpad_7".to_string()));

        // Numpad 7 Key Up: Must SuppressOnly and release from pressed set
        let (decision_up, key_up) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x67,
            0x47,
            false,
            false,
            false,
        );
        assert_eq!(decision_up, HookDecision::SuppressOnly);
        assert_eq!(key_up, Some("numpad_7".to_string()));
        assert!(!pressed.contains("numpad_7"));
    }

    #[test]
    fn test_regression_deck_mode_off_passes_through_all_keys() {
        let cal = CalibrationProfile::standard_default();
        let mut pressed = std::collections::HashSet::new();

        // Numpad 7 in Normal Mode: Must PassThrough
        let (decision, key) = evaluate_key_event(
            EngineMode::Normal,
            &cal,
            &mut pressed,
            0x67,
            0x47,
            false,
            false,
            true,
        );
        assert_eq!(decision, HookDecision::PassThrough);
        assert_eq!(key, None);

        // Top-row numbers in Normal Mode: Must PassThrough
        let (decision_top, _) = evaluate_key_event(
            EngineMode::Normal,
            &cal,
            &mut pressed,
            0x37,
            0x08,
            false,
            false,
            true,
        );
        assert_eq!(decision_top, HookDecision::PassThrough);
    }

    #[test]
    fn test_regression_main_keyboard_never_suppressed_in_deck_mode() {
        let cal = CalibrationProfile::standard_default();
        let mut pressed = std::collections::HashSet::new();

        // Main Enter (Scan 0x1C, Ext: false): MUST PassThrough even when Deck Mode is ON!
        let (decision_enter, _) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x0D,
            0x1C,
            false,
            false,
            true,
        );
        assert_eq!(decision_enter, HookDecision::PassThrough);

        // Top-row number 7 (Scan 0x08, Ext: false): MUST PassThrough even when Deck Mode is ON!
        let (decision_top7, _) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x37,
            0x08,
            false,
            false,
            true,
        );
        assert_eq!(decision_top7, HookDecision::PassThrough);

        // Dedicated Down Arrow (Scan 0x50, Ext: true): MUST PassThrough even when Deck Mode is ON!
        let (decision_arrow, _) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x28,
            0x50,
            true,
            false,
            true,
        );
        assert_eq!(decision_arrow, HookDecision::PassThrough);

        // Injected Key: MUST PassThrough even if matching numpad scan code!
        let (decision_injected, _) = evaluate_key_event(
            EngineMode::Deck,
            &cal,
            &mut pressed,
            0x67,
            0x47,
            false,
            true, // is_injected = true
            true,
        );
        assert_eq!(decision_injected, HookDecision::PassThrough);
    }
}
