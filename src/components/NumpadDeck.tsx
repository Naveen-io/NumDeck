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
}

export const NumpadDeck: React.FC<NumpadDeckProps> = ({
  assignments,
  selectedKeyId,
  onSelectKey,
  activeTriggeredKeyId,
  isDeckMode,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#08090C] overflow-auto select-none">
      {/* Outer Numpad Chassis */}
      <div className="relative p-6 rounded-3xl bg-[#12151C] border border-[#252C39] shadow-2xl flex flex-col items-center">
        {/* Chassis Top Branding & Status */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-[#252C39]/80 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#397BFF] shadow-[0_0_8px_#397BFF]" />
            <span className="text-[11px] font-bold tracking-widest text-[#929CAC] uppercase">
              17-Key Deck Surface
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#626D7E] font-mono">
            <span>MODE:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded ${
                isDeckMode ? 'bg-[#397BFF]/20 text-[#397BFF]' : 'bg-[#191E28] text-[#929CAC]'
              }`}
            >
              {isDeckMode ? 'SUPPRESS & EXECUTE' : 'PASS-THROUGH'}
            </span>
          </div>
        </div>

        {/* CSS Grid Numpad Layout */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(4, 88px)',
            gridTemplateRows: 'repeat(5, 84px)',
          }}
        >
          {NUMPAD_KEYS_LAYOUT.map((keyDef) => {
            const assignment = assignments[keyDef.id];
            const isSelected = selectedKeyId === keyDef.id;
            const isTriggered = activeTriggeredKeyId === keyDef.id;

            // Compute grid area styles for multi-span keys (+, Enter, 0)
            const style: React.CSSProperties = {
              gridRow: keyDef.rowSpan ? `span ${keyDef.rowSpan}` : undefined,
              gridColumn: keyDef.colSpan ? `span ${keyDef.colSpan}` : undefined,
            };

            const hasAction = !!assignment && !!assignment.action;

            return (
              <button
                key={keyDef.id}
                onClick={() => onSelectKey(keyDef.id)}
                style={style}
                className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border text-left overflow-hidden group ${
                  isSelected
                    ? 'bg-[#14264A] border-[#397BFF] shadow-[0_0_16px_rgba(57,123,255,0.25)] ring-1 ring-[#397BFF]'
                    : isTriggered
                    ? 'bg-[#397BFF] border-[#5B91FF] text-white shadow-[0_0_20px_#397BFF] scale-[0.98]'
                    : hasAction
                    ? 'bg-[#191E28] hover:bg-[#202735] border-[#252C39] hover:border-[#397BFF]/50 shadow-md'
                    : 'bg-[#12151C] hover:bg-[#191E28] border-[#252C39]/60 hover:border-[#252C39] text-[#626D7E]'
                }`}
              >
                {/* Physical Key Top Watermark */}
                <div className="w-full flex items-center justify-between pointer-events-none">
                  <span
                    className={`text-[10px] font-mono font-semibold uppercase ${
                      isSelected
                        ? 'text-[#397BFF]'
                        : isTriggered
                        ? 'text-white'
                        : hasAction
                        ? 'text-[#929CAC]'
                        : 'text-[#626D7E]'
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

                {/* Center Content: Icon & Action Label or Plus */}
                {hasAction ? (
                  <div className="flex flex-col items-center justify-center my-auto w-full px-1">
                    <div
                      className={`p-1.5 rounded-lg mb-1 transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-[#397BFF]/20 text-[#397BFF]'
                          : isTriggered
                          ? 'text-white'
                          : 'bg-[#12151C] text-[#F4F6FA]'
                      }`}
                    >
                      <IconRenderer
                        name={assignment.icon}
                        size={keyDef.rowSpan ? 24 : 18}
                        color={isTriggered ? '#FFFFFF' : assignment.color}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold tracking-tight text-center truncate max-w-full leading-tight ${
                        isSelected
                          ? 'text-[#F4F6FA]'
                          : isTriggered
                          ? 'text-white'
                          : 'text-[#F4F6FA]'
                      }`}
                      title={assignment.label}
                    >
                      {assignment.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center my-auto text-[#626D7E] group-hover:text-[#929CAC] transition-colors">
                    <Plus size={18} className="opacity-40 group-hover:opacity-80 mb-0.5" />
                    <span className="text-[10px] font-medium">Assign</span>
                  </div>
                )}

                {/* Bottom subtle indicator line */}
                {hasAction && (
                  <div
                    className="w-full h-0.5 rounded-full mt-auto"
                    style={{
                      backgroundColor: assignment.color || '#397BFF',
                      opacity: isSelected || isTriggered ? 1 : 0.6,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
