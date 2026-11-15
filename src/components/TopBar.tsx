import React from 'react';
import { Profile, KeyboardDeviceInfo } from '../types';
import { 
  ChevronDown, 
  Folder, 
  ArrowLeft, 
  Power,
  CheckCircle2,
  SlidersHorizontal,
  Keyboard
} from 'lucide-react';

interface TopBarProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onManageProfiles?: () => void;
  activeFolderId?: string;
  onNavigateBack: () => void;
  isDeckMode: boolean;
  onToggleDeckMode: () => void;
  numLockOn: boolean;
  isCalibrated: boolean;
  onOpenCalibration: () => void;
  targetKeyboardDevice?: string;
  connectedKeyboards?: KeyboardDeviceInfo[];
}

export const TopBar: React.FC<TopBarProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onManageProfiles,
  activeFolderId,
  onNavigateBack,
  isDeckMode,
  onToggleDeckMode,
  numLockOn,
  isCalibrated,
  onOpenCalibration,
  targetKeyboardDevice,
  connectedKeyboards,
}) => {
  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const currentFolder = activeFolderId && currentProfile
    ? currentProfile.folders?.find((f) => f.id === activeFolderId)
    : undefined;

  const activeDevice = connectedKeyboards?.find((k) => k.id === targetKeyboardDevice);
  const activeDeviceName = activeDevice ? activeDevice.name : (targetKeyboardDevice || 'All Keyboards');

  return (
    <header className="h-14 border-b border-[#1F2532] bg-[#0B0D12] px-6 flex items-center justify-between shrink-0 select-none">
      {/* Profile & Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Profile Dropdown */}
        <div className="relative flex items-center">
          <select
            tabIndex={-1}
            value={activeProfileId}
            onChange={(e) => {
              onSelectProfile(e.target.value);
              e.target.blur();
            }}
            className="appearance-none bg-[#131722] hover:bg-[#181E2C] border border-[#202736] rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-[#F1F5F9] cursor-pointer focus:outline-none focus:border-[#3B82F6]"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#131722] text-[#F1F5F9]">
                Profile: {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 text-[#64748B] pointer-events-none" />
        </div>

        {onManageProfiles && (
          <button
            tabIndex={-1}
            onClick={(e) => {
              onManageProfiles();
              e.currentTarget.blur();
            }}
            className="p-1.5 rounded-lg bg-[#131722] hover:bg-[#181E2C] border border-[#202736] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
            title="Manage Profiles"
          >
            <SlidersHorizontal size={14} />
          </button>
        )}

        {/* Sub-Deck Folder Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="text-[#475569]">/</span>
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#131722] hover:bg-[#181E2C] text-[#F1F5F9] rounded-md border border-[#202736] cursor-pointer font-semibold"
            >
              <ArrowLeft size={13} />
              <Folder size={13} className="text-[#3B82F6]" />
              <span>{currentFolder.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Hardware Status & Controls */}
      <div className="flex items-center gap-3">
        {/* Target Keyboard Filter Pill */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-[#131722] border-[#202736]"
          title={targetKeyboardDevice && targetKeyboardDevice !== 'all' ? `Isolated to: ${activeDeviceName}` : 'Affects all connected keyboards'}
        >
          <Keyboard size={13} className={targetKeyboardDevice && targetKeyboardDevice !== 'all' ? 'text-[#3B82F6]' : 'text-[#64748B]'} />
          <span className="text-[#64748B] font-semibold text-[11px]">
            Device: <strong className={targetKeyboardDevice && targetKeyboardDevice !== 'all' ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>
              {targetKeyboardDevice && targetKeyboardDevice !== 'all'
                ? (activeDeviceName.length > 18 ? activeDeviceName.slice(0, 18) + '...' : activeDeviceName)
                : 'All'}
            </strong>
          </span>
        </div>

        {/* Physical NumLock State */}
        <div 
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-[#131722] border-[#202736]"
          title={numLockOn ? "Hardware NumLock is ON" : "Hardware NumLock is OFF"}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              numLockOn ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
            }`}
          />
          <span className="text-[#64748B] font-semibold text-[11px]">
            NumLock: <strong className={numLockOn ? 'text-[#10B981]' : 'text-[#F59E0B]'}>{numLockOn ? 'ON' : 'OFF'}</strong>
          </span>
        </div>

        {/* Calibration Status Pill */}
        <button
          tabIndex={-1}
          onClick={(e) => {
            onOpenCalibration();
            e.currentTarget.blur();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border bg-[#131722] text-[#94A3B8] hover:text-[#F1F5F9] border-[#202736] hover:border-[#2E3A50] cursor-pointer"
          title="Recalibrate or verify hardware numpad"
        >
          <CheckCircle2 size={13} className={isCalibrated ? 'text-[#10B981]' : 'text-[#F59E0B]'} />
          <span>{isCalibrated ? 'Calibrated' : 'Calibrate'}</span>
        </button>

        {/* Deck Mode Toggle Button */}
        <button
          tabIndex={-1}
          onClick={(e) => {
            onToggleDeckMode();
            e.currentTarget.blur();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
            isDeckMode
              ? 'bg-[#1D4ED8] hover:bg-[#2563EB] text-white border-[#3B82F6]'
              : 'bg-[#131722] hover:bg-[#181E2C] text-[#CBD5E1] border-[#202736]'
          }`}
        >
          <Power size={13} strokeWidth={2.5} />
          <span>{isDeckMode ? 'Deck Mode ON' : 'Deck Mode OFF'}</span>
        </button>
      </div>
    </header>
  );
};
