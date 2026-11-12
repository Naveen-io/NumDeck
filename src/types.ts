export type EngineMode = 'Normal' | 'Deck' | 'Calibrating';

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
  | { type: 'ToggleDeckMode'; payload?: undefined };

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
  folders: DeckFolder[];
}

export interface AppSettings {
  deck_mode: boolean;
  active_profile_id: string;
  active_folder_id?: string;
  emergency_shortcut_enabled: boolean;
  sound_feedback: boolean;
  run_at_startup: boolean;
  minimize_to_tray: boolean;
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

