import React from 'react';
import { AppSettings, DeckState, HotkeyConfig } from '../types';
import {
  Download,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  deckState: DeckState;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
  onResetDefaults: () => void;
  onLaunchOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  deckState,
  onUpdateSettings,
  onExportConfig,
  onImportConfig,
  onResetDefaults,
  onLaunchOnboarding,
}) => {
  const settings = deckState.settings;

  const handleUpdate = (partial: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleHotkeyChange = (partial: Partial<HotkeyConfig>) => {
    onUpdateSettings({
      ...settings,
      activation_hotkey: { ...settings.activation_hotkey, ...partial },
    });
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '32px',
        backgroundColor: '#0B0D12',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            Application Settings
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Customize system behavior, activation shortcuts, layout geometry, and data backups.
          </p>
        </div>

        {/* Section 1: General */}
        <div
          style={{
            backgroundColor: '#12151C',
            borderRadius: '12px',
            border: '1px solid #1F2432',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', borderBottom: '1px solid #1A202E', paddingBottom: '10px' }}>
            General
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Minimize to System Tray</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Closing the window hides it into the tray and keeps keyboard macros active.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.minimize_to_tray}
              onChange={(e) => handleUpdate({ minimize_to_tray: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Start with Windows</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Automatically launch Numpad Deck on Windows boot.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.start_with_windows}
              onChange={(e) => handleUpdate({ start_with_windows: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Default Active State</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Automatically activate Deck Mode whenever Numpad Deck launches.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.default_active_state}
              onChange={(e) => handleUpdate({ default_active_state: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Section 2: Deck Activation Shortcut */}
        <div
          style={{
            backgroundColor: '#12151C',
            borderRadius: '12px',
            border: '1px solid #1F2432',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', borderBottom: '1px solid #1A202E', paddingBottom: '10px' }}>
            Deck Mode Activation Shortcut
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              Press this global combination at any time to switch between physical numpad numbers and custom Deck Mode:
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {(['ctrl', 'alt', 'shift', 'win'] as const).map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleHotkeyChange({ [mod]: !settings.activation_hotkey[mod] })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: settings.activation_hotkey[mod] ? '#2563EB' : '#1C2230',
                    border: '1px solid #2E384D',
                    color: settings.activation_hotkey[mod] ? '#FFFFFF' : '#94A3B8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {mod.toUpperCase()}
                </button>
              ))}

              <select
                value={settings.activation_hotkey.key}
                onChange={(e) => handleHotkeyChange({ key: e.target.value })}
                style={{
                  backgroundColor: '#1C2230',
                  border: '1px solid #2E384D',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              >
                {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'SPACE', 'TAB'].map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Tactile Switch Audio Feedback</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Synthesize subtle mechanical switch click sound when physical keys are pressed.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.sound_feedback}
              onChange={(e) => handleUpdate({ sound_feedback: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Section 3: Appearance & Layout Geometry */}
        <div
          style={{
            backgroundColor: '#12151C',
            borderRadius: '12px',
            border: '1px solid #1F2432',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', borderBottom: '1px solid #1A202E', paddingBottom: '10px' }}>
            Appearance & Physical Keyboard Geometry
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Supported Numpad Layout</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Select physical keyboard layout representation.
              </div>
            </div>
            <select
              value={settings.layout_type}
              onChange={(e) => handleUpdate({ layout_type: e.target.value as any })}
              style={{
                backgroundColor: '#1C2230',
                border: '1px solid #2E384D',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="standard_17">Standard 17-Key (Tall Plus/Enter, Wide 0)</option>
              <option value="compact_18">Compact 18-Key (4x5 Laptop Grid)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Button Corner Radius</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Curvature of deck key tiles.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[8, 12, 16, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => handleUpdate({ button_corner_radius: r })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: settings.button_corner_radius === r ? '#2563EB' : '#1C2230',
                    border: '1px solid #2E384D',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {r}px
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Show Button Labels</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Display button title text underneath icons.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.show_labels}
              onChange={(e) => handleUpdate({ show_labels: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Section 4: Advanced & Reset */}
        <div
          style={{
            backgroundColor: '#12151C',
            borderRadius: '12px',
            border: '1px solid #1F2432',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', borderBottom: '1px solid #1A202E', paddingBottom: '10px' }}>
            Advanced & Configuration Data
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onExportConfig}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#1E2536',
                border: '1px solid #2E384D',
                color: '#F8FAFC',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={14} />
              <span>Export Configuration Backup</span>
            </button>

            <button
              onClick={onImportConfig}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#1E2536',
                border: '1px solid #2E384D',
                color: '#F8FAFC',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Upload size={14} />
              <span>Import Configuration</span>
            </button>

            <button
              onClick={onLaunchOnboarding}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#1E2536',
                border: '1px solid #2E384D',
                color: '#F8FAFC',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={14} />
              <span>Re-run Onboarding Setup</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Reset all profiles and settings back to factory defaults?')) {
                  onResetDefaults();
                }
              }}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Configuration to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
