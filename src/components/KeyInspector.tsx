import React from 'react';
import { NUMPAD_KEYS_LAYOUT, KeyAssignment, CalibrationProfile, ActionConfig } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  Play, 
  Trash2, 
  Edit3, 
  Plus, 
  Cpu, 
  CheckCircle2, 
  Keyboard
} from 'lucide-react';

interface KeyInspectorProps {
  selectedKeyId: string | null;
  assignment?: KeyAssignment;
  calibration: CalibrationProfile;
  onEditAction: () => void;
  onRemoveAction: () => void;
  onTestAction: (action: ActionConfig) => void;
  onQuickAssign: (assignment: KeyAssignment) => void;
}

export const KeyInspector: React.FC<KeyInspectorProps> = ({
  selectedKeyId,
  assignment,
  calibration,
  onEditAction,
  onRemoveAction,
  onTestAction,
  onQuickAssign,
}) => {
  if (!selectedKeyId) {
    return (
      <aside className="w-84 bg-[#0D0F14] border-l border-[#252C39] p-6 flex flex-col items-center justify-center text-center select-none text-[#626D7E] shrink-0">
        <Keyboard size={36} className="mb-3 opacity-30 text-[#397BFF]" />
        <h3 className="text-sm font-semibold text-[#929CAC] mb-1">No Key Selected</h3>
        <p className="text-xs max-w-[210px] leading-relaxed">
          Click any key on the numeric keypad to inspect its hardware signature and configure macros.
        </p>
      </aside>
    );
  }

  const keyDef = NUMPAD_KEYS_LAYOUT.find((k) => k.id === selectedKeyId);
  const signatures = calibration.signatures[selectedKeyId] || [];
  const hasAction = !!assignment && !!assignment.action;

  // Format signature string
  const signatureText = signatures.length > 0
    ? signatures.map((s) => `Scan: 0x${s.scan_code.toString(16).toUpperCase()} (${s.scan_code}) | Ext: ${s.is_extended ? '1' : '0'} | VK: 0x${s.vk_code.toString(16).toUpperCase()}`).join('\n')
    : 'Standard Hardware Default';

  return (
    <aside className="w-84 bg-[#0D0F14] border-l border-[#252C39] flex flex-col h-full overflow-y-auto select-none shrink-0">
      {/* Inspector Header */}
      <div className="p-5 border-b border-[#252C39] bg-[#0A0C10]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#397BFF] font-bold">
            Hardware Inspector
          </span>
          <span className="text-[10px] font-mono text-[#626D7E]">{keyDef?.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F4F6FA] flex items-center gap-2">
            <span>Physical Position:</span>
            <span className="px-2.5 py-0.5 bg-[#191E28] border border-[#252C39] rounded-md text-xs font-mono font-bold text-[#397BFF]">
              {keyDef?.defaultLabel}
            </span>
          </h2>
          <span className="text-[10px] font-mono uppercase text-[#626D7E] bg-[#12151C] px-2 py-0.5 rounded border border-[#252C39]">
            {keyDef?.category}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Hardware Calibration Telemetry */}
        <div className="p-3.5 rounded-xl bg-[#12151C] border border-[#252C39] shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#929CAC]">
              <Cpu size={14} className="text-[#397BFF]" />
              <span>Low-Level Hardware Signature</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[#65C991] font-semibold">
              <CheckCircle2 size={12} />
              <span>Mapped</span>
            </span>
          </div>

          <pre className="text-[10.5px] font-mono bg-[#08090C] p-2.5 rounded-lg border border-[#252C39]/80 text-[#929CAC] overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {signatureText}
          </pre>
        </div>

        {/* Assigned Action Card or Unassigned Call-To-Action */}
        {hasAction ? (
          <div className="p-4 rounded-xl bg-[#12151C] border border-[#252C39] space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl bg-[#191E28] border border-[#252C39] flex items-center justify-center shadow-inner"
                  style={assignment.color ? { borderColor: `${assignment.color}50` } : undefined}
                >
                  <IconRenderer name={assignment.icon} size={24} color={assignment.color || '#397BFF'} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F4F6FA] leading-tight mb-1">{assignment.label}</h3>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#191E28] text-[#929CAC] border border-[#252C39]">
                    {assignment.action?.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Summary Details */}
            <div className="p-2.5 rounded-lg bg-[#08090C] border border-[#252C39]/80 text-xs font-mono text-[#929CAC] break-all leading-relaxed">
              {formatActionSummary(assignment.action!)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                tabIndex={-1}
                onClick={(e) => {
                  onTestAction(assignment.action!);
                  e.currentTarget.blur();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#397BFF]/15 hover:bg-[#397BFF]/25 border border-[#397BFF]/40 text-[#397BFF] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Execute action right now to verify functionality"
              >
                <Play size={13} fill="currentColor" />
                <span>Test Action</span>
              </button>

              <button
                tabIndex={-1}
                onClick={(e) => {
                  onEditAction();
                  e.currentTarget.blur();
                }}
                className="py-2 px-3 rounded-lg bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] text-[#F4F6FA] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                tabIndex={-1}
                onClick={(e) => {
                  onRemoveAction();
                  e.currentTarget.blur();
                }}
                className="py-2 px-2.5 rounded-lg bg-[#ED7777]/10 hover:bg-[#ED7777]/20 border border-[#ED7777]/30 text-[#ED7777] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                title="Remove action from this key"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              tabIndex={-1}
              onClick={(e) => {
                onEditAction();
                e.currentTarget.blur();
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Configure Key Action</span>
            </button>

            {/* Quick Application Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold text-[#626D7E] uppercase tracking-wider block mb-2.5">
                Quick Application Presets
              </span>

              <div className="space-y-1.5">
                <QuickPresetItem
                  icon="chrome"
                  label="Google Chrome"
                  color="#4285F4"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Chrome',
                      icon: 'chrome',
                      color: '#4285F4',
                      action: { type: 'OpenPath', payload: { path: 'https://www.google.com' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon="vscode"
                  label="Visual Studio Code"
                  color="#007ACC"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'VS Code',
                      icon: 'vscode',
                      color: '#007ACC',
                      action: { type: 'LaunchApp', payload: { path: 'code' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon="terminal"
                  label="Windows Terminal"
                  color="#4EC9B0"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Terminal',
                      icon: 'terminal',
                      color: '#4EC9B0',
                      action: { type: 'LaunchApp', payload: { path: 'wt.exe' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon="discord"
                  label="Discord"
                  color="#5865F2"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Discord',
                      icon: 'discord',
                      color: '#5865F2',
                      action: { type: 'OpenPath', payload: { path: 'discord://' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon="spotify"
                  label="Spotify"
                  color="#1DB954"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Spotify',
                      icon: 'spotify',
                      color: '#1DB954',
                      action: { type: 'OpenPath', payload: { path: 'spotify:' } },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const QuickPresetItem: React.FC<{
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ icon, label, color, onClick }) => (
  <button
    tabIndex={-1}
    onClick={(e) => {
      onClick();
      e.currentTarget.blur();
    }}
    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12151C] hover:bg-[#191E28] border border-[#252C39] text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] transition-all cursor-pointer"
  >
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded flex items-center justify-center">
        <IconRenderer name={icon} size={18} color={color} />
      </div>
      <span>{label}</span>
    </div>
    <span className="text-[10px] text-[#626D7E] uppercase font-mono">1-Click</span>
  </button>
);

function formatActionSummary(action: ActionConfig): string {
  switch (action.type) {
    case 'LaunchApp':
      return `Launch: ${action.payload.path} ${action.payload.arguments || ''}`;
    case 'OpenPath':
      return `Open: ${action.payload.path}`;
    case 'Hotkey':
      return `Hotkey: ${action.payload.modifiers.join(' + ').toUpperCase()} + ${action.payload.key}`;
    case 'TypeText':
      return `Type: "${action.payload.text}"`;
    case 'SystemMedia':
      return `Media: ${action.payload.command.replace('_', ' ').toUpperCase()}`;
    case 'MultiAction':
      return `Sequence: ${action.payload.steps.length} sequential action(s)`;
    case 'SwitchProfile':
      return `Switch to profile: ${action.payload.profile_id}`;
    case 'NavigateFolder':
      return `Open folder: ${action.payload.folder_id}`;
    case 'ToggleDeckMode':
      return `Toggle Deck Mode`;
    case 'BackToRootFolder':
      return `Back to Main Deck`;
    default:
      return JSON.stringify(action);
  }
}
