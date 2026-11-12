import React, { useState } from 'react';
import {
  NumpadKey,
  ButtonConfig,
  ActionConfig,
  NUMPAD_KEY_LABELS,
  Profile,
  MultiActionStep,
  SystemMediaCommand,
} from '../types';
import { IconRenderer, POPULAR_ICONS } from './IconRenderer';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  FolderPlus,
  Search,
  Check,
} from 'lucide-react';

interface ButtonEditorProps {
  selectedKey: NumpadKey;
  buttonConfig: ButtonConfig;
  activeProfile: Profile;
  profiles: Profile[];
  onUpdateConfig: (newConfig: ButtonConfig) => void;
  onTestExecute: (action: ActionConfig) => void;
  onCreateFolder: (name: string) => string;
}

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const ButtonEditor: React.FC<ButtonEditorProps> = ({
  selectedKey,
  buttonConfig,
  activeProfile,
  profiles,
  onUpdateConfig,
  onTestExecute,
  onCreateFolder,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  const keyInfo = NUMPAD_KEY_LABELS[selectedKey];

  const handleTitleChange = (title: string) => {
    onUpdateConfig({ ...buttonConfig, title });
  };

  const handleColorChange = (accent_color: string) => {
    onUpdateConfig({ ...buttonConfig, accent_color });
  };

  const handleIconChange = (icon: string) => {
    onUpdateConfig({ ...buttonConfig, icon });
    setShowIconPicker(false);
  };

  const handleActionTypeChange = (type: ActionConfig['type']) => {
    let newAction: ActionConfig = { type: 'none' };

    switch (type) {
      case 'launch_app':
        newAction = {
          type: 'launch_app',
          payload: { path: 'notepad.exe', arguments: [], working_dir: null },
        };
        break;
      case 'open_url':
        newAction = {
          type: 'open_url',
          payload: { url: 'https://' },
        };
        break;
      case 'open_file_folder':
        newAction = {
          type: 'open_file_folder',
          payload: { path: 'C:\\' },
        };
        break;
      case 'send_hotkey':
        newAction = {
          type: 'send_hotkey',
          payload: { modifiers: ['ctrl'], key: 'c' },
        };
        break;
      case 'type_text':
        newAction = {
          type: 'type_text',
          payload: { text: '' },
        };
        break;
      case 'system_media':
        newAction = {
          type: 'system_media',
          payload: { command: 'play_pause' },
        };
        break;
      case 'navigate_folder':
        newAction = {
          type: 'navigate_folder',
          payload: { folder_id: activeProfile.folders[0]?.id || '__BACK__' },
        };
        break;
      case 'switch_profile':
        newAction = {
          type: 'switch_profile',
          payload: { profile_id: profiles[0]?.id || activeProfile.id },
        };
        break;
      case 'multi_action':
        newAction = {
          type: 'multi_action',
          payload: {
            steps: [
              {
                id: 'step_1',
                name: 'First Step',
                enabled: true,
                delay_ms: 100,
                action: { type: 'open_url', payload: { url: 'https://' } },
              },
            ],
          },
        };
        break;
      default:
        newAction = { type: 'none' };
    }

    onUpdateConfig({ ...buttonConfig, action: newAction });
  };

  const handleResetButton = () => {
    onUpdateConfig({
      title: '',
      icon: '',
      accent_color: null,
      custom_icon_path: null,
      action: { type: 'none' },
      enabled: true,
    });
  };

  const handleTestRun = () => {
    onTestExecute(buttonConfig.action);
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 1200);
  };

  return (
    <aside
      style={{
        width: '320px',
        minWidth: '320px',
        backgroundColor: '#0F1218',
        borderLeft: '1px solid #1F2430',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflowY: 'auto',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1A1F2B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Button Configuration
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            {keyInfo.name} ({keyInfo.symbol})
          </div>
        </div>

        <button
          onClick={handleTestRun}
          title="Test Execute Action"
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: testSuccess ? '1px solid #10B981' : '1px solid #2B354D',
            background: testSuccess ? '#10B98120' : '#1A2130',
            color: testSuccess ? '#34D399' : '#F8FAFC',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          {testSuccess ? <Check size={14} /> : <Play size={14} fill="#F8FAFC" />}
          <span>{testSuccess ? 'Executed!' : 'Test'}</span>
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
            Button Title
          </label>
          <input
            type="text"
            value={buttonConfig.title}
            placeholder={keyInfo.name}
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#161A23',
              border: '1px solid #2A3142',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Accent Color Palette */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
            Accent Glow Color
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => {
              const isSelected = buttonConfig.accent_color === c;
              return (
                <div
                  key={c}
                  onClick={() => handleColorChange(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: c,
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 0 2px #FFFFFF, 0 0 10px ${c}` : 'none',
                    transform: isSelected ? 'scale(1.15)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Icon Selector */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>Icon</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              style={{
                fontSize: '11px',
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showIconPicker ? 'Close Picker' : 'Choose Icon'}
            </button>
          </div>

          <div
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#161A23',
              border: '1px solid #2A3142',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#202636',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: buttonConfig.accent_color || '#3B82F6',
              }}
            >
              <IconRenderer name={buttonConfig.icon} size={20} color={buttonConfig.accent_color || '#3B82F6'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                {buttonConfig.icon || 'No Icon Selected'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Click to browse library</div>
            </div>
          </div>

          {/* Icon Search Modal / Panel */}
          {showIconPicker && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#141822',
                border: '1px solid #252D3D',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1C2230',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                }}
              >
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {POPULAR_ICONS.map((cat) => {
                  const filtered = cat.icons.filter((ic) =>
                    ic.toLowerCase().includes(iconSearch.toLowerCase())
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div key={cat.category}>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>
                        {cat.category}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                        {filtered.map((iconName) => (
                          <div
                            key={iconName}
                            title={iconName}
                            onClick={() => handleIconChange(iconName)}
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              backgroundColor: buttonConfig.icon === iconName ? '#2563EB' : '#1C2230',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#FFFFFF',
                            }}
                          >
                            <IconRenderer name={iconName} size={16} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Type Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
            Action Type
          </label>
          <select
            value={buttonConfig.action.type}
            onChange={(e) => handleActionTypeChange(e.target.value as ActionConfig['type'])}
            style={{
              width: '100%',
              backgroundColor: '#161A23',
              border: '1px solid #2A3142',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="none">No Action (Unassigned)</option>
            <option value="launch_app">Launch Application / File</option>
            <option value="open_url">Open Website / URL</option>
            <option value="open_file_folder">Open Folder</option>
            <option value="send_hotkey">Keyboard Shortcut</option>
            <option value="type_text">Type Text</option>
            <option value="system_media">System / Media Control</option>
            <option value="navigate_folder">Button Folder (Sub-page)</option>
            <option value="switch_profile">Switch Profile</option>
            <option value="multi_action">Multi-Action (Macro Sequence)</option>
          </select>
        </div>

        {/* Action Specific Fields */}
        <div style={{ backgroundColor: '#141822', padding: '14px', borderRadius: '8px', border: '1px solid #202636' }}>
          {buttonConfig.action.type === 'launch_app' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Application Executable or Path</label>
                <input
                  type="text"
                  value={buttonConfig.action.payload.path}
                  placeholder="e.g. calc.exe, code, wt.exe"
                  onChange={(e) => {
                    if (buttonConfig.action.type === 'launch_app') {
                      onUpdateConfig({
                        ...buttonConfig,
                        action: {
                          ...buttonConfig.action,
                          payload: { ...buttonConfig.action.payload, path: e.target.value },
                        },
                      });
                    }
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#1C2230',
                    border: '1px solid #2D374D',
                    borderRadius: '5px',
                    padding: '6px 10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Arguments (space separated)</label>
                <input
                  type="text"
                  value={buttonConfig.action.payload.arguments.join(' ')}
                  placeholder="Optional args"
                  onChange={(e) => {
                    if (buttonConfig.action.type === 'launch_app') {
                      const args = e.target.value.split(' ').filter(Boolean);
                      onUpdateConfig({
                        ...buttonConfig,
                        action: {
                          ...buttonConfig.action,
                          payload: { ...buttonConfig.action.payload, arguments: args },
                        },
                      });
                    }
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#1C2230',
                    border: '1px solid #2D374D',
                    borderRadius: '5px',
                    padding: '6px 10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                />
              </div>
            </div>
          )}

          {buttonConfig.action.type === 'open_url' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Website URL</label>
              <input
                type="text"
                value={buttonConfig.action.payload.url}
                placeholder="https://example.com"
                onChange={(e) => {
                  if (buttonConfig.action.type === 'open_url') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { url: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              />
            </div>
          )}

          {buttonConfig.action.type === 'open_file_folder' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Folder or Document Path</label>
              <input
                type="text"
                value={buttonConfig.action.payload.path}
                placeholder="C:\Users\Name\Documents"
                onChange={(e) => {
                  if (buttonConfig.action.type === 'open_file_folder') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { path: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              />
            </div>
          )}

          {buttonConfig.action.type === 'send_hotkey' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Modifiers</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ctrl', 'alt', 'shift', 'win'].map((mod) => {
                  const isChecked =
                    buttonConfig.action.type === 'send_hotkey' &&
                    buttonConfig.action.payload.modifiers.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => {
                        if (buttonConfig.action.type === 'send_hotkey') {
                          const currentMods = buttonConfig.action.payload.modifiers;
                          const newMods = isChecked
                            ? currentMods.filter((m) => m !== mod)
                            : [...currentMods, mod];
                          onUpdateConfig({
                            ...buttonConfig,
                            action: {
                              ...buttonConfig.action,
                              payload: { ...buttonConfig.action.payload, modifiers: newMods },
                            },
                          });
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: isChecked ? '#2563EB' : '#1C2230',
                        color: isChecked ? '#FFFFFF' : '#94A3B8',
                        border: '1px solid #2E384D',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {mod.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>Key</label>
              <input
                type="text"
                value={buttonConfig.action.payload.key}
                placeholder="e.g. c, v, f12, escape, tab"
                onChange={(e) => {
                  if (buttonConfig.action.type === 'send_hotkey') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { ...buttonConfig.action.payload, key: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
            </div>
          )}

          {buttonConfig.action.type === 'type_text' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Text to Type</label>
              <textarea
                rows={4}
                value={buttonConfig.action.payload.text}
                placeholder="Type snippet or prompt..."
                onChange={(e) => {
                  if (buttonConfig.action.type === 'type_text') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { text: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '8px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {buttonConfig.action.type === 'system_media' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>System Command</label>
              <select
                value={buttonConfig.action.payload.command}
                onChange={(e) => {
                  if (buttonConfig.action.type === 'system_media') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { command: e.target.value as SystemMediaCommand },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                <option value="play_pause">Play / Pause Media</option>
                <option value="volume_up">Volume Up (+)</option>
                <option value="volume_down">Volume Down (-)</option>
                <option value="volume_mute">Mute / Unmute Audio</option>
                <option value="next_track">Next Track</option>
                <option value="previous_track">Previous Track</option>
                <option value="lock_screen">Lock Windows Workstation</option>
              </select>
            </div>
          )}

          {buttonConfig.action.type === 'navigate_folder' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Target Folder</label>
              <select
                value={buttonConfig.action.payload.folder_id}
                onChange={(e) => {
                  if (buttonConfig.action.type === 'navigate_folder') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { folder_id: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                <option value="__BACK__">← Back to Root Deck</option>
                {activeProfile.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    Folder: {f.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const name = prompt('Enter new folder name:');
                  if (name) {
                    const newId = onCreateFolder(name);
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        type: 'navigate_folder',
                        payload: { folder_id: newId },
                      },
                    });
                  }
                }}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '5px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <FolderPlus size={14} />
                <span>Create New Folder</span>
              </button>
            </div>
          )}

          {buttonConfig.action.type === 'switch_profile' && (
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8' }}>Switch To Profile</label>
              <select
                value={buttonConfig.action.payload.profile_id}
                onChange={(e) => {
                  if (buttonConfig.action.type === 'switch_profile') {
                    onUpdateConfig({
                      ...buttonConfig,
                      action: {
                        ...buttonConfig.action,
                        payload: { profile_id: e.target.value },
                      },
                    });
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1C2230',
                  border: '1px solid #2D374D',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {buttonConfig.action.type === 'multi_action' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>Macro Sequence</span>
                <button
                  onClick={() => {
                    if (buttonConfig.action.type === 'multi_action') {
                      const newStep: MultiActionStep = {
                        id: `step_${Date.now()}`,
                        name: `Action ${buttonConfig.action.payload.steps.length + 1}`,
                        enabled: true,
                        delay_ms: 200,
                        action: { type: 'open_url', payload: { url: 'https://' } },
                      };
                      onUpdateConfig({
                        ...buttonConfig,
                        action: {
                          ...buttonConfig.action,
                          payload: {
                            steps: [...buttonConfig.action.payload.steps, newStep],
                          },
                        },
                      });
                    }
                  }}
                  style={{
                    fontSize: '11px',
                    color: '#3B82F6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={12} /> Add Step
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {buttonConfig.action.payload.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: '#1C2230',
                      border: '1px solid #2A3347',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>
                        #{idx + 1} {step.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => {
                            if (buttonConfig.action.type === 'multi_action') {
                              const steps = buttonConfig.action.payload.steps.filter((s) => s.id !== step.id);
                              onUpdateConfig({
                                ...buttonConfig,
                                action: {
                                  ...buttonConfig.action,
                                  payload: { steps },
                                },
                              });
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      Delay: {step.delay_ms}ms • Type: {step.action.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buttonConfig.action.type === 'none' && (
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: '12px', padding: '12px 0' }}>
              Select an action type above to configure this physical key.
            </div>
          )}
        </div>

        {/* Clear / Reset Button */}
        <button
          onClick={handleResetButton}
          style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #2E364A',
            background: '#141822',
            color: '#EF4444',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.1s ease',
          }}
        >
          <RotateCcw size={14} />
          <span>Reset / Clear Key</span>
        </button>
      </div>
    </aside>
  );
};
