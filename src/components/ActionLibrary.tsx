import React from 'react';
import { ActionConfig, NumpadKey, NUMPAD_KEY_LABELS } from '../types';
import { IconRenderer } from './IconRenderer';
import { ArrowRight } from 'lucide-react';

interface ActionLibraryProps {
  selectedKey: NumpadKey;
  onApplyPreset: (title: string, icon: string, color: string, action: ActionConfig) => void;
}

interface ActionPreset {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: ActionConfig;
}

const PRESETS: ActionPreset[] = [
  // Media & System
  {
    id: 'vol_up',
    category: 'System Audio & Media',
    title: 'Volume Up',
    description: 'Increases system output master volume',
    icon: 'Volume2',
    color: '#10B981',
    action: { type: 'system_media', payload: { command: 'volume_up' } },
  },
  {
    id: 'vol_down',
    category: 'System Audio & Media',
    title: 'Volume Down',
    description: 'Decreases system output master volume',
    icon: 'Volume1',
    color: '#10B981',
    action: { type: 'system_media', payload: { command: 'volume_down' } },
  },
  {
    id: 'mute',
    category: 'System Audio & Media',
    title: 'Mute Audio',
    description: 'Toggles master audio mute state',
    icon: 'VolumeX',
    color: '#EF4444',
    action: { type: 'system_media', payload: { command: 'volume_mute' } },
  },
  {
    id: 'play_pause',
    category: 'System Audio & Media',
    title: 'Play / Pause',
    description: 'Toggles active media playback on Windows',
    icon: 'Play',
    color: '#10B981',
    action: { type: 'system_media', payload: { command: 'play_pause' } },
  },
  {
    id: 'next_track',
    category: 'System Audio & Media',
    title: 'Next Track',
    description: 'Skips to next media track',
    icon: 'SkipForward',
    color: '#8B5CF6',
    action: { type: 'system_media', payload: { command: 'next_track' } },
  },
  {
    id: 'prev_track',
    category: 'System Audio & Media',
    title: 'Previous Track',
    description: 'Returns to previous media track',
    icon: 'SkipBack',
    color: '#8B5CF6',
    action: { type: 'system_media', payload: { command: 'previous_track' } },
  },
  {
    id: 'lock_screen',
    category: 'System Audio & Media',
    title: 'Lock Workstation',
    description: 'Instantly locks Windows session',
    icon: 'Lock',
    color: '#6366F1',
    action: { type: 'system_media', payload: { command: 'lock_screen' } },
  },

  // Productivity
  {
    id: 'task_manager',
    category: 'Productivity & Tools',
    title: 'Task Manager',
    description: 'Opens Task Manager (Ctrl+Shift+Esc)',
    icon: 'Activity',
    color: '#14B8A6',
    action: {
      type: 'send_hotkey',
      payload: { modifiers: ['ctrl', 'shift'], key: 'escape' },
    },
  },
  {
    id: 'screenshot',
    category: 'Productivity & Tools',
    title: 'Screen Snipping',
    description: 'Opens Windows Snipping Tool (Win+Shift+S)',
    icon: 'Camera',
    color: '#06B6D4',
    action: {
      type: 'send_hotkey',
      payload: { modifiers: ['win', 'shift'], key: 's' },
    },
  },
  {
    id: 'show_desktop',
    category: 'Productivity & Tools',
    title: 'Show Desktop',
    description: 'Minimizes all windows to desktop (Win+D)',
    icon: 'Monitor',
    color: '#64748B',
    action: {
      type: 'send_hotkey',
      payload: { modifiers: ['win'], key: 'd' },
    },
  },
  {
    id: 'calc',
    category: 'Productivity & Tools',
    title: 'Calculator',
    description: 'Launches Windows Calculator',
    icon: 'Calculator',
    color: '#3B82F6',
    action: {
      type: 'launch_app',
      payload: { path: 'calc.exe', arguments: [], working_dir: null },
    },
  },
  {
    id: 'notepad',
    category: 'Productivity & Tools',
    title: 'Notepad',
    description: 'Opens Windows Notepad',
    icon: 'FileText',
    color: '#F59E0B',
    action: {
      type: 'launch_app',
      payload: { path: 'notepad.exe', arguments: [], working_dir: null },
    },
  },
  {
    id: 'terminal',
    category: 'Productivity & Tools',
    title: 'PowerShell / Terminal',
    description: 'Launches PowerShell terminal',
    icon: 'Terminal',
    color: '#10B981',
    action: {
      type: 'launch_app',
      payload: { path: 'powershell.exe', arguments: [], working_dir: null },
    },
  },
  {
    id: 'c_drive',
    category: 'Productivity & Tools',
    title: 'File Explorer (C:)',
    description: 'Opens root Windows File Explorer',
    icon: 'FolderOpen',
    color: '#EC4899',
    action: {
      type: 'open_file_folder',
      payload: { path: 'C:\\' },
    },
  },

  // Web & Online
  {
    id: 'google',
    category: 'Web & Applications',
    title: 'Google Search',
    description: 'Opens Google in default browser',
    icon: 'Search',
    color: '#06B6D4',
    action: {
      type: 'open_url',
      payload: { url: 'https://www.google.com' },
    },
  },
  {
    id: 'github',
    category: 'Web & Applications',
    title: 'GitHub',
    description: 'Opens GitHub dashboard',
    icon: 'Globe',
    color: '#F8FAFC',
    action: {
      type: 'open_url',
      payload: { url: 'https://github.com' },
    },
  },
  {
    id: 'youtube',
    category: 'Web & Applications',
    title: 'YouTube',
    description: 'Opens YouTube video platform',
    icon: 'Video',
    color: '#EF4444',
    action: {
      type: 'open_url',
      payload: { url: 'https://youtube.com' },
    },
  },
  {
    id: 'chatgpt',
    category: 'Web & Applications',
    title: 'ChatGPT',
    description: 'Opens ChatGPT web interface',
    icon: 'Zap',
    color: '#10B981',
    action: {
      type: 'open_url',
      payload: { url: 'https://chat.openai.com' },
    },
  },
];

export const ActionLibrary: React.FC<ActionLibraryProps> = ({
  selectedKey,
  onApplyPreset,
}) => {
  const selectedKeyInfo = NUMPAD_KEY_LABELS[selectedKey];

  // Group by category
  const categories = Array.from(new Set(PRESETS.map((p) => p.category)));

  return (
    <div
      style={{
        flex: 1,
        padding: '32px',
        backgroundColor: '#0B0D12',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Banner */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#12151C',
            border: '1px solid #1F2432',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Action Library
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              Click any action below to immediately bind it to your currently selected key:
            </p>
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#1E2536',
              border: '1px solid #3B82F6',
              color: '#60A5FA',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            Target: {selectedKeyInfo.name} ({selectedKeyInfo.symbol})
          </div>
        </div>

        {/* Categories & Presets */}
        {categories.map((cat) => (
          <div key={cat}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '12px' }}>
              {cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {PRESETS.filter((p) => p.category === cat).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() =>
                    onApplyPreset(preset.title, preset.icon, preset.color, preset.action)
                  }
                  style={{
                    backgroundColor: '#141822',
                    borderRadius: '10px',
                    border: '1px solid #1E2330',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.backgroundColor = '#181E2B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E2330';
                    e.currentTarget.style.backgroundColor = '#141822';
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: `${preset.color}20`,
                      border: `1px solid ${preset.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: preset.color,
                      flexShrink: 0,
                    }}
                  >
                    <IconRenderer name={preset.icon} size={18} color={preset.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                      {preset.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {preset.description}
                    </div>
                  </div>

                  <ArrowRight size={14} color="#64748B" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
