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
}

export const NumpadDeck: React.FC<NumpadDeckProps> = ({
  assignments,
  selectedKeyId,
  onSelectKey,
  activeTriggeredKeyId,
  isDeckMode,
  profileName,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#08090C] overflow-auto select-none relative">
      {/* Outer Anodized Hardware Chassis */}
      <div className="relative p-7 rounded-[28px] bg-[#0E1117] border border-[#252C39] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center max-w-full">
        {/* Hardware Corner Screws / Accents */}
        <div className="absolute top-3.5 left-3.5 w-2 h-2 rounded-full border border-[#252C39] bg-[#191E28] flex items-center justify-center">
          <div className="w-1 h-0.5 bg-[#626D7E]" />
        </div>
        <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full border border-[#252C39] bg-[#191E28] flex items-center justify-center">
          <div className="w-1 h-0.5 bg-[#626D7E]" />
        </div>
        <div className="absolute bottom-3.5 left-3.5 w-2 h-2 rounded-full border border-[#252C39] bg-[#191E28] flex items-center justify-center">
          <div className="w-1 h-0.5 bg-[#626D7E]" />
        </div>
        <div className="absolute bottom-3.5 right-3.5 w-2 h-2 rounded-full border border-[#252C39] bg-[#191E28] flex items-center justify-center">
          <div className="w-1 h-0.5 bg-[#626D7E]" />
        </div>

        {/* Chassis Top Plate Branding & Status Bar */}
        <div className="w-full flex items-center justify-between pb-3.5 mb-4 border-b border-[#202735] px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161C26] border border-[#252C39]">
              <span className={`w-2 h-2 rounded-full ${isDeckMode ? 'bg-[#397BFF] shadow-[0_0_8px_#397BFF]' : 'bg-[#626D7E]'}`} />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#929CAC] uppercase">
                {isDeckMode ? 'DECK ACTIVE' : 'NORMAL MODE'}
              </span>
            </div>
            <span className="text-[11px] text-[#626D7E] font-medium">|</span>
            <span className="text-[11px] text-[#929CAC] font-semibold tracking-wide">
              Profile: <span className="text-[#F4F6FA] font-bold">{profileName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#626D7E] font-mono">
            <span>17-KEY COMMAND MATRIX</span>
          </div>
        </div>

        {/* Recessed Numpad Switch Plate */}
        <div className="p-3.5 rounded-2xl bg-[#080A0E] border border-[#1B222E] shadow-inner">
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: 'repeat(4, 94px)',
              gridTemplateRows: 'repeat(5, 86px)',
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
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-xl transition-all duration-100 cursor-pointer border select-none overflow-hidden text-left ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#162544] to-[#0F1B33] border-[#397BFF] shadow-[0_0_16px_rgba(57,123,255,0.3)] ring-1 ring-[#397BFF]'
                      : isTriggered
                      ? 'translate-y-1 bg-[#397BFF] border-[#5B91FF] text-white shadow-none ring-2 ring-white/50'
                      : hasAction
                      ? 'bg-gradient-to-b from-[#1C222E] to-[#12161F] hover:from-[#242C3B] hover:to-[#171C26] border-[#252C39] hover:border-[#397BFF]/50 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] active:translate-y-0.5'
                      : 'bg-gradient-to-b from-[#141720] to-[#0D1016] hover:from-[#1A1F2B] hover:to-[#11141C] border-[#1E2532] hover:border-[#2B3547] text-[#626D7E] shadow-[0_3px_6px_rgba(0,0,0,0.4)] active:translate-y-0.5'
                  }`}
                >
                  {/* Key Legend Inset (Top Row) */}
                  <div className="w-full flex items-center justify-between pointer-events-none">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors ${
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

                    {/* Small category / color dot */}
                    {hasAction && assignment?.color && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: assignment.color }}
                      />
                    )}
                  </div>

                  {/* Key Center: Icon & Label */}
                  {hasAction ? (
                    <div className="flex flex-col items-center justify-center my-auto w-full px-1 text-center">
                      <div
                        className={`p-1.5 rounded-lg mb-1 flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-[#397BFF]/20 text-[#397BFF]'
                            : isTriggered
                            ? 'text-white'
                            : 'bg-[#0E1117]/80 text-[#F4F6FA]'
                        }`}
                      >
                        <IconRenderer
                          name={assignment.icon}
                          size={keyDef.rowSpan ? 26 : 20}
                          color={isTriggered ? '#FFFFFF' : assignment.color}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-bold tracking-tight truncate max-w-full leading-tight ${
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
                      <Plus size={16} className="opacity-30 group-hover:opacity-70 mb-0.5 transition-opacity" />
                      <span className="text-[10px] font-medium tracking-tight">Assign</span>
                    </div>
                  )}

                  {/* Keycap Bottom Accent Line */}
                  {hasAction && (
                    <div
                      className="w-8 h-[3px] rounded-full mx-auto mt-auto opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{
                        backgroundColor: assignment.color || '#397BFF',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chassis Bottom Micro Status */}
        <div className="w-full flex items-center justify-between pt-3 mt-3 px-2 text-[10px] text-[#626D7E] font-mono">
          <span>SUPPRESSION: {isDeckMode ? 'ENABLED (RETURN 1)' : 'PASS-THROUGH (CallNextHookEx)'}</span>
          <span>DISARM: ESC 3X</span>
        </div>
      </div>
    </div>
  );
};
