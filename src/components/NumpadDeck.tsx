import React from 'react';
import { NUMPAD_KEYS_LAYOUT, KeyAssignment } from '../types';
import { IconRenderer } from './IconRenderer';
import { Plus } from 'lucide-react';

interface NumpadDeckProps {
  assignments: Record<string, KeyAssignment>;
  selectedKeyId: string | null;
  onSelectKey: (keyId: string) => void;
  activeTriggeredKeyId: string | null;
  isDeckMode: boolean;
  profileName: string;
  activeLayer?: number;
  onSwitchLayer?: (layer: number) => void;
}

export const NumpadDeck: React.FC<NumpadDeckProps> = ({
  assignments,
  selectedKeyId,
  onSelectKey,
  activeTriggeredKeyId,
  isDeckMode,
  profileName,
  activeLayer = 0,
  onSwitchLayer,
}) => {
  const configuredCount = Object.values(assignments).filter((a) => !!a.action).length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#08090C] overflow-auto select-none">
      {/* Deck Chassis */}
      <div className={`p-6 rounded-2xl bg-[#0D1017] border ${activeLayer === 1 ? 'border-[#8B5CF6]/30' : 'border-[#1F2532]'} flex flex-col items-center max-w-full transition-colors`}>
        {/* Chassis Header Bar */}
        <div className="w-full flex items-center justify-between pb-3.5 mb-4 border-b border-[#1A202C] px-1 gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isDeckMode ? (activeLayer === 1 ? 'bg-[#8B5CF6]' : 'bg-[#3B82F6]') : 'bg-[#475569]'
              }`}
            />
            <span className="text-xs font-bold text-[#F1F5F9]">
              {profileName}
            </span>
            <span className="text-xs text-[#475569]">•</span>
            <span className="text-xs text-[#94A3B8]">
              {configuredCount} of 17 Keys ({activeLayer === 1 ? 'Layer B' : 'Layer A'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Layer A / B Switcher Tabs */}
            {onSwitchLayer && (
              <div className="flex items-center p-0.5 bg-[#080A0E] border border-[#202736] rounded-lg">
                <button
                  type="button"
                  onClick={() => onSwitchLayer(0)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    activeLayer === 0
                      ? 'bg-[#3B82F6] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                >
                  Layer A
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchLayer(1)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    activeLayer === 1
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                >
                  Layer B
                </button>
              </div>
            )}

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isDeckMode
                  ? (activeLayer === 1 ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30' : 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30')
                  : 'bg-[#161B26] text-[#64748B] border-[#222B3A]'
              }`}
            >
              {isDeckMode ? (activeLayer === 1 ? 'Deck (Layer B)' : 'Deck Mode Active') : 'Normal Mode'}
            </span>
          </div>
        </div>

        {/* Numpad Switch Plate */}
        <div className={`p-3 rounded-xl bg-[#080A0E] border ${activeLayer === 1 ? 'border-[#8B5CF6]/20' : 'border-[#1A202C]'}`}>
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: 'repeat(4, 92px)',
              gridTemplateRows: 'repeat(5, 84px)',
            }}
          >
            {NUMPAD_KEYS_LAYOUT.map((keyDef) => {
              const assignment = assignments[keyDef.id];
              const isSelected = selectedKeyId === keyDef.id;
              const isTriggered = activeTriggeredKeyId === keyDef.id;

              const style: React.CSSProperties = {
                gridRow: keyDef.rowSpan ? `span ${keyDef.rowSpan}` : undefined,
                gridColumn: keyDef.colSpan ? `span ${keyDef.colSpan}` : undefined,
              };

              const hasAction = !!assignment && !!assignment.action;

              return (
                <button
                  key={keyDef.id}
                  tabIndex={-1}
                  onClick={(e) => {
                    onSelectKey(keyDef.id);
                    e.currentTarget.blur();
                  }}
                  style={style}
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-lg cursor-pointer border select-none overflow-hidden text-left ${
                    isTriggered
                      ? 'bg-[#2563EB] border-[#3B82F6] text-white ring-2 ring-white/60'
                      : isSelected
                      ? (activeLayer === 1 ? 'bg-[#24153B] border-[#8B5CF6] text-[#F1F5F9] ring-1 ring-[#8B5CF6]' : 'bg-[#16233B] border-[#3B82F6] text-[#F1F5F9] ring-1 ring-[#3B82F6]')
                      : hasAction
                      ? 'bg-[#131722] hover:bg-[#181E2E] border-[#222B3B] hover:border-[#2E3A50] text-[#E2E8F0]'
                      : 'bg-[#0E1118] hover:bg-[#141822] border-[#1A202C] hover:border-[#252E3E] text-[#64748B]'
                  }`}
                >
                  {/* Top: Key Hardware Label & Status */}
                  <div className="w-full flex items-center justify-between pointer-events-none">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase ${
                        isTriggered
                          ? 'text-white'
                          : isSelected
                          ? (activeLayer === 1 ? 'text-[#A78BFA]' : 'text-[#3B82F6]')
                          : hasAction
                          ? 'text-[#94A3B8]'
                          : 'text-[#475569]'
                      }`}
                    >
                      {keyDef.defaultLabel}
                    </span>

                    {hasAction && assignment?.color && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: assignment.color }}
                      />
                    )}
                  </div>

                  {/* Center: Action Icon or Empty Add Cue */}
                  <div className="flex-1 flex items-center justify-center pointer-events-none my-1">
                    {hasAction ? (
                      <IconRenderer
                        name={assignment.icon}
                        size={keyDef.rowSpan && keyDef.rowSpan > 1 ? 26 : 22}
                        color={isTriggered ? '#FFFFFF' : assignment.color}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded flex items-center justify-center text-[#334155] group-hover:text-[#64748B]">
                        <Plus size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Bottom: Readable Action Label */}
                  <div className="w-full text-center pointer-events-none truncate">
                    <span
                      className={`text-[10px] font-medium truncate block ${
                        isTriggered
                          ? 'text-white'
                          : isSelected
                          ? 'text-[#E2E8F0] font-semibold'
                          : hasAction
                          ? 'text-[#CBD5E1]'
                          : 'text-[#334155] group-hover:text-[#64748B]'
                      }`}
                    >
                      {hasAction ? assignment.label : 'Empty'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
