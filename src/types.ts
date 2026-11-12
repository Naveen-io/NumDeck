export type NumpadKey =
  | 'num_lock'
  | 'divide'
  | 'multiply'
  | 'subtract'
  | 'num7'
  | 'num8'
  | 'num9'
  | 'plus'
  | 'num4'
  | 'num5'
  | 'num6'
  | 'num1'
  | 'num2'
  | 'num3'
  | 'enter'
  | 'num0'
  | 'decimal';

export type SystemMediaCommand =
  | 'volume_up'
  | 'volume_down'
  | 'volume_mute'
  | 'play_pause'
  | 'next_track'
  | 'previous_track'
  | 'lock_screen';

export type ActionConfig =
  | { type: 'none' }
  | {
      type: 'launch_app';
      payload: {
        path: string;
        arguments: string[];
        working_dir?: string | null;
      };
    }
  | {
      type: 'open_url';
      payload: {
        url: string;
      };
    }
  | {
      type: 'open_file_folder';
      payload: {
        path: string;
      };
    }
  | {
      type: 'send_hotkey';
      payload: {
        modifiers: string[];
        key: string;
      };
    }
  | {
      type: 'type_text';
      payload: {
        text: string;
      };
    }
  | {
      type: 'system_media';
      payload: {
        command: SystemMediaCommand;
      };
    }
  | {
      type: 'navigate_folder';
      payload: {
        folder_id: string;
      };
    }
  | {
      type: 'switch_profile';
      payload: {
        profile_id: string;
      };
    }
  | {
      type: 'multi_action';
      payload: {
        steps: MultiActionStep[];
      };
    };

export interface MultiActionStep {
  id: string;
  name: string;
  enabled: boolean;
  delay_ms: number;
  action: ActionConfig;
}

export interface ButtonConfig {
  title: string;
  icon: string;
  custom_icon_path?: string | null;
  accent_color?: string | null;
  action: ActionConfig;
  enabled: boolean;
}

export interface DeckFolder {
  id: string;
  name: string;
  keys: Record<NumpadKey, ButtonConfig>;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  color: string;
  root_keys: Record<NumpadKey, ButtonConfig>;
  folders: DeckFolder[];
}

export interface HotkeyConfig {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  win: boolean;
  key: string;
}

export interface AppSettings {
  activation_hotkey: HotkeyConfig;
  start_with_windows: boolean;
  minimize_to_tray: boolean;
  default_active_state: boolean;
  layout_type: 'standard_17' | 'compact_18';
  compact_laptop_mode: boolean;
  custom_key_mappings?: Record<string, NumpadKey>;
  dark_mode: boolean;
  button_corner_radius: number;
  show_labels: boolean;
  onboarding_completed: boolean;
  sound_feedback: boolean;
}

export interface RawKeyEvent {
  vk: number;
  vk_name: string;
  scan: number;
  scan_byte: number;
  is_extended: boolean;
  is_down: boolean;
  numlock_on: boolean;
  mapped_key: NumpadKey | null;
  key_name: string;
  device_name?: string;
  timestamp: string;
}

export interface DeckState {
  version: number;
  active_profile_id: string;
  active_folder_id: string | null;
  is_deck_active: boolean;
  profiles: Profile[];
  settings: AppSettings;
}

export interface KeyboardDeviceInfo {
  name: string;
  device_id: string;
  is_internal: boolean;
  function_keys: number;
  indicators: number;
}

export interface HardwareDetectionReport {
  numlock_on: boolean;
  keyboards_found: number;
  keyboards: KeyboardDeviceInfo[];
  numpad_ready: boolean;
  primary_device?: string;
}

export const NUMPAD_KEY_LABELS: Record<NumpadKey, { name: string; symbol: string; defaultColor: string }> = {
  num_lock: { name: 'NumLock', symbol: 'NUM', defaultColor: '#3B82F6' },
  divide: { name: 'Divide', symbol: '/', defaultColor: '#06B6D4' },
  multiply: { name: 'Multiply', symbol: '*', defaultColor: '#F59E0B' },
  subtract: { name: 'Subtract', symbol: '-', defaultColor: '#EC4899' },
  num7: { name: 'Numpad 7', symbol: '7', defaultColor: '#10B981' },
  num8: { name: 'Numpad 8', symbol: '8', defaultColor: '#10B981' },
  num9: { name: 'Numpad 9', symbol: '9', defaultColor: '#10B981' },
  plus: { name: 'Add', symbol: '+', defaultColor: '#10B981' },
  num4: { name: 'Numpad 4', symbol: '4', defaultColor: '#8B5CF6' },
  num5: { name: 'Numpad 5', symbol: '5', defaultColor: '#8B5CF6' },
  num6: { name: 'Numpad 6', symbol: '6', defaultColor: '#8B5CF6' },
  num1: { name: 'Numpad 1', symbol: '1', defaultColor: '#F97316' },
  num2: { name: 'Numpad 2', symbol: '2', defaultColor: '#F97316' },
  num3: { name: 'Numpad 3', symbol: '3', defaultColor: '#F97316' },
  enter: { name: 'Enter', symbol: 'ENT', defaultColor: '#3B82F6' },
  num0: { name: 'Numpad 0', symbol: '0', defaultColor: '#6366F1' },
  decimal: { name: 'Decimal', symbol: '.', defaultColor: '#64748B' },
};
