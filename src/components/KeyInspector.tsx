import React from 'react';
import { NUMPAD_KEYS_LAYOUT, KeyAssignment, ActionConfig } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  Play, 
  Trash2, 
  Edit3, 
  Plus, 
  Keyboard 
} from 'lucide-react';

interface KeyInspectorProps {
  selectedKeyId: string | null;
  assignment?: KeyAssignment;
  onEditAction: () => void;
  onRemoveAction: () => void;
  onTestAction: (action: ActionConfig) => void;
  onQuickAssign: (assignment: KeyAssignment) => void;
}

export const KeyInspector: React.FC<KeyInspectorProps> = ({
  selectedKeyId,
  assignment,
  onEditAction,
  onRemoveAction,
  onTestAction,
  onQuickAssign,
}) => {
  if (!selectedKeyId) {
    return (
      <aside className="w-80 bg-[#0B0D12] border-l border-[#1F2532] p-6 flex flex-col items-center justify-center text-center select-none text-[#64748B] shrink-0">
        <Keyboard size={32} className="mb-3 text-[#334155]" />
        <h3 className="text-xs font-bold text-[#94A3B8] mb-1">No Key Selected</h3>
        <p className="text-[11px] max-w-[200px] leading-relaxed text-[#64748B]">
          Select any key on the numpad deck to configure actions or choose a preset.
        </p>
      </aside>
    );
  }

  const keyDef = NUMPAD_KEYS_LAYOUT.find((k) => k.id === selectedKeyId);
  const hasAction = !!assignment && !!assignment.action;

  // Format action details
  const getActionDetails = (act?: ActionConfig) => {
    if (!act) return { typeName: 'Unassigned', detail: 'No action' };
    switch (act.type) {
      case 'LaunchApp':
        return { typeName: 'Launch Application', detail: act.payload?.path || 'App executable' };
      case 'OpenPath':
        return { typeName: 'Open URL / File', detail: act.payload?.path || 'Path' };
      case 'Hotkey': {
        const mods = act.payload?.modifiers || [];
        const k = act.payload?.key || '';
        const combo = [...mods.map((m) => m.toUpperCase()), k].join(' + ');
        return { typeName: 'Keyboard Shortcut', detail: combo };
      }
      case 'TypeText':
        return { typeName: 'Type Text', detail: act.payload?.text || 'Text phrase' };
      case 'SystemMedia':
        return { typeName: 'System Media', detail: act.payload?.command?.replace('_', ' ').toUpperCase() || 'Media Command' };
      case 'ToggleDeckMode':
        return { typeName: 'Mode Switch', detail: 'Toggle Normal / Deck Mode' };
      default:
        return { typeName: act.type, detail: 'Configured action' };
    }
  };

  const actionInfo = getActionDetails(assignment?.action);

  // Quick Action Presets
  const quickPresets: Array<{
    label: string;
    icon: string;
    color: string;
    action: ActionConfig;
  }> = [
    {
      label: 'Chrome',
      icon: 'chrome',
      color: '#4285F4',
      action: { type: 'OpenPath', payload: { path: 'https://www.google.com' } },
    },
    {
      label: 'VS Code',
      icon: 'vscode',
      color: '#007ACC',
      action: { type: 'LaunchApp', payload: { path: 'code' } },
    },
    {
      label: 'Terminal',
      icon: 'terminal',
      color: '#4EC9B0',
      action: { type: 'LaunchApp', payload: { path: 'wt.exe' } },
    },
    {
      label: 'Calculator',
      icon: 'Calculator',
      color: '#E9B86A',
      action: { type: 'LaunchApp', payload: { path: 'calc.exe' } },
    },
    {
      label: 'Notepad',
      icon: 'notepad',
      color: '#0078D7',
      action: { type: 'LaunchApp', payload: { path: 'notepad.exe' } },
    },
    {
      label: 'Explorer',
      icon: 'explorer',
      color: '#FFA000',
      action: { type: 'LaunchApp', payload: { path: 'explorer.exe' } },
    },
    {
      label: 'Spotify',
      icon: 'spotify',
      color: '#1DB954',
      action: { type: 'OpenPath', payload: { path: 'spotify:' } },
    },
    {
      label: 'Discord',
      icon: 'discord',
      color: '#5865F2',
      action: { type: 'OpenPath', payload: { path: 'discord://' } },
    },
    {
      label: 'Screenshot',
      icon: 'Camera',
      color: '#3B82F6',
      action: { type: 'Hotkey', payload: { modifiers: ['win', 'shift'], key: 'S' } },
    },
    {
      label: 'Mute Audio',
      icon: 'VolumeX',
      color: '#EF4444',
      action: { type: 'SystemMedia', payload: { command: 'mute' } },
    },
    {
      label: 'Play / Pause',
      icon: 'PlayPause',
      color: '#10B981',
      action: { type: 'SystemMedia', payload: { command: 'play_pause' } },
    },
    {
      label: 'Lock PC',
      icon: 'Lock',
      color: '#64748B',
      action: { type: 'Hotkey', payload: { modifiers: ['win'], key: 'L' } },
    },
  ];

  return (
    <aside className="w-80 bg-[#0B0D12] border-l border-[#1F2532] flex flex-col h-full overflow-y-auto select-none shrink-0">
      {/* Key Header */}
      <div className="p-4 border-b border-[#1F2532] bg-[#0E1117]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Property Inspector
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              hasAction
                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#1E2433] text-[#64748B] border-[#252E40]'
            }`}
          >
            {hasAction ? 'Assigned' : 'Empty'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#151923] border border-[#273042] rounded-md text-xs font-mono font-bold text-[#3B82F6]">
              {keyDef?.defaultLabel}
            </span>
            <span className="text-xs font-bold text-[#F1F5F9]">
              Numpad {keyDef?.defaultLabel}
            </span>
          </div>

          <span className="text-[10px] font-medium text-[#64748B] uppercase">
            {keyDef?.category}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Assigned Action Card or Unassigned Callout */}
        {hasAction ? (
          <div className="p-4 rounded-xl bg-[#131722] border border-[#222B3B] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center shrink-0">
                <IconRenderer name={assignment.icon} size={22} color={assignment.color} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#F1F5F9] truncate">
                  {assignment.label}
                </h4>
                <span className="text-[10px] font-semibold text-[#3B82F6] block">
                  {actionInfo.typeName}
                </span>
              </div>
            </div>

            <div className="bg-[#0B0D12] px-3 py-2 rounded-lg border border-[#1A202C]">
              <span className="text-[10px] text-[#64748B] block font-medium">Configured Target:</span>
              <span className="text-xs font-mono text-[#CBD5E1] truncate block mt-0.5">
                {actionInfo.detail}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                tabIndex={-1}
                onClick={(e) => {
                  if (assignment.action) onTestAction(assignment.action);
                  e.currentTarget.blur();
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#1D4ED8] hover:bg-[#2563EB] text-white flex items-center justify-center gap-2 cursor-pointer border border-[#3B82F6]"
              >
                <Play size={13} fill="currentColor" />
                <span>Test Action</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  tabIndex={-1}
                  onClick={(e) => {
                    onEditAction();
                    e.currentTarget.blur();
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#181E2C] hover:bg-[#222B3E] text-[#E2E8F0] border border-[#2A354C] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Configure</span>
                </button>

                <button
                  tabIndex={-1}
                  onClick={(e) => {
                    onRemoveAction();
                    e.currentTarget.blur();
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#181E2C] hover:bg-[#2F1D20] text-[#94A3B8] hover:text-[#EF4444] border border-[#2A354C] hover:border-[#EF4444]/40 flex items-center justify-center gap-1 cursor-pointer"
                  title="Clear Key Assignment"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#131722] border border-[#222B3B] text-center space-y-3">
            <div className="w-9 h-9 rounded-full bg-[#182030] border border-[#273349] flex items-center justify-center mx-auto text-[#64748B]">
              <Plus size={16} strokeWidth={2.5} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#F1F5F9]">Unassigned Key</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Assign an app, web link, or macro to this key.
              </p>
            </div>

            <button
              tabIndex={-1}
              onClick={(e) => {
                onEditAction();
                e.currentTarget.blur();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#1D4ED8] hover:bg-[#2563EB] text-white flex items-center justify-center gap-2 cursor-pointer border border-[#3B82F6]"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Assign Action</span>
            </button>
          </div>
        )}

        {/* Quick Action Presets Library */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Quick Presets
            </span>
            <span className="text-[10px] text-[#475569]">Click to assign</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                tabIndex={-1}
                onClick={(e) => {
                  onQuickAssign({
                    key_id: selectedKeyId,
                    label: preset.label,
                    icon: preset.icon,
                    color: preset.color,
                    action: preset.action,
                  });
                  e.currentTarget.blur();
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#0E1118] hover:bg-[#161B26] border border-[#1A202C] hover:border-[#2B384F] text-left cursor-pointer group"
              >
                <div className="w-6 h-6 rounded bg-[#151923] border border-[#222B3B] flex items-center justify-center shrink-0">
                  <IconRenderer name={preset.icon} size={14} color={preset.color} />
                </div>
                <span className="text-[11px] font-semibold text-[#94A3B8] group-hover:text-[#F1F5F9] truncate">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
