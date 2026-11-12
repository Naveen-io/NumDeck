import React from 'react';
import { Profile } from '../types';
import { 
  ChevronDown, 
  Folder, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TopBarProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  activeFolderId?: string;
  onNavigateBack: () => void;
  isDeckMode: boolean;
  onToggleDeckMode: () => void;
  numLockOn: boolean;
  isCalibrated: boolean;
  onOpenCalibration: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  activeFolderId,
  onNavigateBack,
  isDeckMode,
  onToggleDeckMode,
  numLockOn,
  isCalibrated,
  onOpenCalibration,
}) => {
  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const currentFolder = activeFolderId && currentProfile
    ? currentProfile.folders?.find((f) => f.id === activeFolderId)
    : undefined;

  return (
    <header className="h-14 border-b border-[#252C39] bg-[#0D0F14]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
      {/* Profile & Navigation Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Profile Dropdown */}
        <div className="relative flex items-center">
          <select
            value={activeProfileId}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="appearance-none bg-[#12151C] hover:bg-[#191E28] border border-[#252C39] rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-[#F4F6FA] cursor-pointer focus:outline-none focus:border-[#397BFF] transition-all"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#12151C] text-[#F4F6FA]">
                Profile: {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 text-[#929CAC] pointer-events-none" />
        </div>

        {/* Sub-Deck Folder Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center gap-2 text-xs text-[#929CAC]">
            <span className="text-[#626D7E]">/</span>
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#191E28] hover:bg-[#252C39] text-[#F4F6FA] rounded-md border border-[#252C39] transition-all"
            >
              <ArrowLeft size={13} />
              <Folder size={13} className="text-[#397BFF]" />
              <span>{currentFolder.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Badges & Deck Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* NumLock Status Indicator */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-[#12151C] border-[#252C39]"
          title={numLockOn ? "Physical NumLock is ON" : "Physical NumLock is OFF"}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              numLockOn ? 'bg-[#65C991] shadow-[0_0_8px_#65C991]' : 'bg-[#E9B86A]'
            }`}
          />
          <span className="text-[#929CAC]">
            NumLock: <strong className="text-[#F4F6FA]">{numLockOn ? 'ON' : 'OFF'}</strong>
          </span>
        </div>

        {/* Calibration Status */}
        <button
          onClick={onOpenCalibration}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
            isCalibrated
              ? 'bg-[#12151C] text-[#929CAC] border-[#252C39] hover:border-[#397BFF]/60'
              : 'bg-[#E9B86A]/10 text-[#E9B86A] border-[#E9B86A]/40 hover:bg-[#E9B86A]/20'
          }`}
          title="Click to calibrate or test physical numpad"
        >
          {isCalibrated ? (
            <CheckCircle2 size={13} className="text-[#65C991]" />
          ) : (
            <AlertCircle size={13} className="text-[#E9B86A]" />
          )}
          <span>{isCalibrated ? 'Hardware Calibrated' : 'Needs Calibration'}</span>
        </button>

        {/* Emergency Protection Indicator */}
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[#12151C] text-[#626D7E] border border-[#252C39]"
          title="Emergency Fail-Safe Active: Pressing ESC 3 times restores normal keyboard instantly"
        >
          <ShieldCheck size={13} className="text-[#65C991]" />
          <span>Fail-Safe Ready</span>
        </div>

        {/* Deck Mode Toggle Button */}
        <button
          onClick={onToggleDeckMode}
          className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isDeckMode
              ? 'bg-[#14264A] text-[#397BFF] border-[#397BFF]/60 shadow-[0_0_12px_rgba(57,123,255,0.2)]'
              : 'bg-[#12151C] text-[#929CAC] border-[#252C39] hover:text-[#F4F6FA]'
          }`}
        >
          <span>Deck Mode</span>
          {isDeckMode ? (
            <ToggleRight size={20} className="text-[#397BFF]" />
          ) : (
            <ToggleLeft size={20} className="text-[#626D7E]" />
          )}
        </button>
      </div>
    </header>
  );
};
