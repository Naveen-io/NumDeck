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
  ExternalLink,
  Keyboard,
  Globe,
  Music,
  Terminal
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
      <aside className="w-80 bg-[#0D0F14] border-l border-[#252C39] p-6 flex flex-col items-center justify-center text-center select-none text-[#626D7E]">
        <Keyboard size={36} className="mb-3 opacity-30 text-[#397BFF]" />
        <h3 className="text-sm font-semibold text-[#929CAC] mb-1">No Key Selected</h3>
        <p className="text-xs max-w-[200px]">Click any key on the numeric keypad to inspect or configure its action.</p>
      </aside>
    );
  }

  const keyDef = NUMPAD_KEYS_LAYOUT.find((k) => k.id === selectedKeyId);
  const signatures = calibration.signatures[selectedKeyId] || [];
  const hasAction = !!assignment && !!assignment.action;

  // Format signature string
  const signatureText = signatures.length > 0
    ? signatures.map((s) => `Scan: 0x${s.scan_code.toString(16).toUpperCase()} | Ext: ${s.is_extended ? 1 : 0} | VK: 0x${s.vk_code.toString(16).toUpperCase()}`).join('\n')
    : 'Default Standard Signature';

  return (
    <aside className="w-84 bg-[#0D0F14] border-l border-[#252C39] flex flex-col h-full overflow-y-auto select-none shrink-0">
      {/* Inspector Header */}
      <div className="p-5 border-b border-[#252C39]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#397BFF] font-bold">Key Inspector</span>
          <span className="text-[10px] font-mono text-[#626D7E]">{keyDef?.id}</span>
        </div>
        <h2 className="text-base font-bold text-[#F4F6FA] flex items-center gap-2">
          <span>Physical Key:</span>
          <span className="px-2 py-0.5 bg-[#191E28] border border-[#252C39] rounded text-sm font-mono text-[#397BFF]">
            {keyDef?.defaultLabel}
          </span>
        </h2>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Hardware Calibration Details */}
        <div className="p-3.5 rounded-xl bg-[#12151C] border border-[#252C39]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#929CAC]">
              <Cpu size={14} className="text-[#397BFF]" />
              <span>Hardware Signature</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[#65C991] font-semibold">
              <CheckCircle2 size={12} />
              <span>Verified</span>
            </span>
          </div>

          <pre className="text-[11px] font-mono bg-[#08090C] p-2.5 rounded-lg border border-[#252C39]/80 text-[#929CAC] overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {signatureText}
          </pre>
        </div>

        {/* Action Details or Empty State */}
        {hasAction ? (
          <div className="p-4 rounded-xl bg-[#12151C] border border-[#252C39] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#191E28] border border-[#252C39] flex items-center justify-center shadow-inner"
                  style={assignment.color ? { borderColor: `${assignment.color}40` } : undefined}
                >
                  <IconRenderer name={assignment.icon} size={20} color={assignment.color || '#397BFF'} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F4F6FA]">{assignment.label}</h3>
                  <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#191E28] text-[#929CAC]">
                    {assignment.action?.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Summary Details */}
            <div className="p-2.5 rounded-lg bg-[#08090C] border border-[#252C39]/80 text-xs font-mono text-[#929CAC] break-all">
              {formatActionSummary(assignment.action!)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onTestAction(assignment.action!)}
                className="flex-1 py-2 px-3 rounded-lg bg-[#397BFF]/15 hover:bg-[#397BFF]/25 border border-[#397BFF]/40 text-[#397BFF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                title="Execute action right now to verify it works"
              >
                <Play size={13} fill="currentColor" />
                <span>Test Action</span>
              </button>

              <button
                onClick={onEditAction}
                className="py-2 px-3 rounded-lg bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] text-[#F4F6FA] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                onClick={onRemoveAction}
                className="py-2 px-2.5 rounded-lg bg-[#ED7777]/10 hover:bg-[#ED7777]/20 border border-[#ED7777]/30 text-[#ED7777] text-xs font-semibold flex items-center justify-center transition-all"
                title="Remove action from this key"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={onEditAction}
              className="w-full py-3 px-4 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Configure Key Action</span>
            </button>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-[#626D7E] uppercase tracking-wider block mb-2.5">
                Quick Presets
              </span>

              <div className="space-y-1.5">
                <QuickPresetItem
                  icon={Music}
                  label="Play / Pause Audio"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Play / Pause',
                      icon: 'PlayPause',
                      color: '#65C991',
                      action: { type: 'SystemMedia', payload: { command: 'play_pause' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon={Globe}
                  label="Open Browser"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Browser',
                      icon: 'Globe',
                      color: '#397BFF',
                      action: { type: 'OpenPath', payload: { path: 'https://www.google.com' } },
                    })
                  }
                />
                <QuickPresetItem
                  icon={Terminal}
                  label="Launch Terminal"
                  onClick={() =>
                    onQuickAssign({
                      key_id: selectedKeyId,
                      label: 'Terminal',
                      icon: 'Terminal',
                      color: '#E9B86A',
                      action: { type: 'LaunchApp', payload: { path: 'wt.exe' } },
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
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12151C] hover:bg-[#191E28] border border-[#252C39] text-xs font-medium text-[#929CAC] hover:text-[#F4F6FA] transition-all"
  >
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="text-[#397BFF]" />
      <span>{label}</span>
    </div>
    <ExternalLink size={12} className="opacity-40" />
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
      return `Multi-Action: ${action.payload.steps.length} sequential step(s)`;
    case 'SwitchProfile':
      return `Profile -> ${action.payload.profile_id}`;
    case 'NavigateFolder':
      return `Folder -> ${action.payload.folder_id}`;
    case 'ToggleDeckMode':
      return `Toggle Deck Mode`;
    case 'BackToRootFolder':
      return `Back to Main Deck`;
    default:
      return JSON.stringify(action);
  }
}
