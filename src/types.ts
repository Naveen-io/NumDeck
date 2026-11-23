export type EngineMode = 'Normal' | 'Deck' | 'Calibrating';

export type NavTab = 'home' | 'deck' | 'settings';

export interface KeySignature {
  vk_code: number;
  scan_code: number;
  is_extended: boolean;
}

export interface DiagnosticEvent {
  timestamp: number;
  event_type: 'keydown' | 'keyup';
  vk_code: number;
  vk_name: string;
  scan_code: number;
  is_extended: boolean;
  is_injected: boolean;
  numlock_on: boolean;
  is_suppressed: boolean;
  matched_logical_key?: string;
}

export type ActionConfig =
  | { type: 'LaunchApp'; payload: { path: string; arguments?: string } }
  | { type: 'OpenPath'; payload: { path: string } }
  | { type: 'Hotkey'; payload: { modifiers: string[]; key: string } }
  | { type: 'TypeText'; payload: { text: string } }
  | { type: 'SystemMedia'; payload: { command: string } }
  | { type: 'MultiAction'; payload: { steps: ActionStep[] } }
  | { type: 'SwitchProfile'; payload: { profile_id: string } }
  | { type: 'NavigateFolder'; payload: { folder_id: string } }
  | { type: 'BackToRootFolder'; payload?: undefined }
  | { type: 'ToggleDeckMode'; payload?: undefined }
  | { type: 'ToggleLayer'; payload?: undefined }
  | { type: 'SwitchLayer'; payload: { layer: number } }
  | { type: 'Passthrough'; payload?: undefined };

export interface ActionStep {
  action: ActionConfig;
  delay_ms: number;
}

export interface KeyAssignment {
  key_id: string;
  label: string;
  icon: string;
  color?: string;
  action?: ActionConfig;
}

export interface DeckFolder {
  id: string;
  name: string;
  keys: Record<string, KeyAssignment>;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  keys: Record<string, KeyAssignment>;
  layer_b_keys?: Record<string, KeyAssignment>;
  folders: DeckFolder[];
  app_association?: string;
}

export interface KeyboardDeviceInfo {
  id: string;
  name: string;
  raw_path: string;
  is_internal: boolean;
  is_virtual: boolean;
  is_connected?: boolean;
}

export interface GlobalHotkeyConfig {
  enabled: boolean;
  modifiers: string[]; // ['ctrl', 'shift']
  key: string;         // 'D'
}

export interface AppSettings {
  deck_mode: boolean;
  active_profile_id: string;
  active_folder_id?: string;
  emergency_shortcut_enabled: boolean;
  sound_feedback: boolean;
  run_at_startup: boolean;
  minimize_to_tray: boolean;
  target_keyboard_device?: string;
  global_hotkey?: GlobalHotkeyConfig;
  auto_profile_switching?: boolean;
  active_layer?: number;
}

export interface CalibrationProfile {
  signatures: Record<string, KeySignature[]>;
  calibrated_at?: string;
  is_completed: boolean;
}

export interface AppData {
  version: number;
  settings: AppSettings;
  calibration: CalibrationProfile;
  profiles: Profile[];
}

export interface NumpadKeyDef {
  id: string;
  defaultLabel: string;
  gridArea: string; // CSS grid area / positioning
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  category: 'number' | 'operator' | 'action' | 'control';
}

export const NUMPAD_KEYS_LAYOUT: NumpadKeyDef[] = [
  // Row 1
  { id: 'numpad_numlock', defaultLabel: 'NumLock', gridArea: 'r1c1', row: 1, col: 1, category: 'control' },
  { id: 'numpad_divide', defaultLabel: '/', gridArea: 'r1c2', row: 1, col: 2, category: 'operator' },
  { id: 'numpad_multiply', defaultLabel: '*', gridArea: 'r1c3', row: 1, col: 3, category: 'operator' },
  { id: 'numpad_subtract', defaultLabel: '-', gridArea: 'r1c4', row: 1, col: 4, category: 'operator' },
  
  // Row 2
  { id: 'numpad_7', defaultLabel: '7', gridArea: 'r2c1', row: 2, col: 1, category: 'number' },
  { id: 'numpad_8', defaultLabel: '8', gridArea: 'r2c2', row: 2, col: 2, category: 'number' },
  { id: 'numpad_9', defaultLabel: '9', gridArea: 'r2c3', row: 2, col: 3, category: 'number' },
  { id: 'numpad_add', defaultLabel: '+', gridArea: 'r2c4', row: 2, col: 4, rowSpan: 2, category: 'operator' },
  
  // Row 3
  { id: 'numpad_4', defaultLabel: '4', gridArea: 'r3c1', row: 3, col: 1, category: 'number' },
  { id: 'numpad_5', defaultLabel: '5', gridArea: 'r3c2', row: 3, col: 2, category: 'number' },
  { id: 'numpad_6', defaultLabel: '6', gridArea: 'r3c3', row: 3, col: 3, category: 'number' },
  
  // Row 4
  { id: 'numpad_1', defaultLabel: '1', gridArea: 'r4c1', row: 4, col: 1, category: 'number' },
  { id: 'numpad_2', defaultLabel: '2', gridArea: 'r4c2', row: 4, col: 2, category: 'number' },
  { id: 'numpad_3', defaultLabel: '3', gridArea: 'r4c3', row: 4, col: 3, category: 'number' },
  { id: 'numpad_enter', defaultLabel: 'Enter', gridArea: 'r4c4', row: 4, col: 4, rowSpan: 2, category: 'action' },
  
  // Row 5
  { id: 'numpad_0', defaultLabel: '0', gridArea: 'r5c1', row: 5, col: 1, colSpan: 2, category: 'number' },
  { id: 'numpad_decimal', defaultLabel: '.', gridArea: 'r5c3', row: 5, col: 3, category: 'number' },
];

export const ALL_NUMPAD_KEYS: string[] = NUMPAD_KEYS_LAYOUT.map((k) => k.id);

/**
 * Maps a browser DOM KeyboardEvent to a logical Numpad Deck key ID.
 * Uses W3C KeyboardEvent.location === 3 (DOM_KEY_LOCATION_NUMPAD) and e.code
 * to guarantee 100% isolation from main keyboard numbers, arrows, and Enter.
 */
export function domEventToNumpadKeyId(e: { code: string; location: number; key?: string }): string | null {
  if (e.location === 3 || e.code.startsWith('Numpad') || e.code === 'NumLock') {
    switch (e.code) {
      case 'Numpad7': return 'numpad_7';
      case 'Numpad8': return 'numpad_8';
      case 'Numpad9': return 'numpad_9';
      case 'Numpad4': return 'numpad_4';
      case 'Numpad5': return 'numpad_5';
      case 'Numpad6': return 'numpad_6';
      case 'Numpad1': return 'numpad_1';
      case 'Numpad2': return 'numpad_2';
      case 'Numpad3': return 'numpad_3';
      case 'Numpad0': return 'numpad_0';
      case 'NumpadDecimal': return 'numpad_decimal';
      case 'NumpadDivide': return 'numpad_divide';
      case 'NumpadMultiply': return 'numpad_multiply';
      case 'NumpadSubtract': return 'numpad_subtract';
      case 'NumpadAdd': return 'numpad_add';
      case 'NumpadEnter': return 'numpad_enter';
      case 'NumLock': return 'numpad_numlock';
      default: {
        if (e.location === 3) {
          switch (e.key) {
            case 'Home': return 'numpad_7';
            case 'ArrowUp': return 'numpad_8';
            case 'PageUp': return 'numpad_9';
            case 'ArrowLeft': return 'numpad_4';
            case 'Clear': return 'numpad_5';
            case 'ArrowRight': return 'numpad_6';
            case 'End': return 'numpad_1';
            case 'ArrowDown': return 'numpad_2';
            case 'PageDown': return 'numpad_3';
            case 'Insert': return 'numpad_0';
            case 'Delete': return 'numpad_decimal';
            case 'Enter': return 'numpad_enter';
          }
        }
        return null;
      }
    }
  }
  return null;
}

