import React from 'react';
import { Profile, KeyboardDeviceInfo, GlobalHotkeyConfig } from '../types';
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
  activeLayer?: number;
  onSwitchLayer?: (layer: number) => void;
  globalHotkey?: GlobalHotkeyConfig;
  onOpenSettings?: () => void;
  isTargetConnected?: boolean;
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
  activeLayer = 0,
  onSwitchLayer,
  globalHotkey,
  onOpenSettings,
  isTargetConnected = true,
}) => {
  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const currentFolder = activeFolderId && currentProfile
    ? currentProfile.folders?.find((f) => f.id === activeFolderId)
    : undefined;

  const activeDevice = connectedKeyboards?.find((k) => k.id === targetKeyboardDevice);
  const activeDeviceName = activeDevice ? activeDevice.name : (targetKeyboardDevice || 'All Keyboards');
  const isIsolated = targetKeyboardDevice && targetKeyboardDevice !== 'all';

  return (
    <header className="h-14 border-b border-[#1F2532] bg-[#0B0D12] px-6 flex items-center justify-between shrink-0 select-none">
      {/* Profile, Layers & Navigation Breadcrumb */}
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

        {/* Layer Switcher Pill */}
        {onSwitchLayer && (
          <div className="flex items-center p-0.5 bg-[#131722] border border-[#202736] rounded-lg">
            <button
              type="button"
              onClick={() => onSwitchLayer(0)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeLayer === 0
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
              title="Primary Layer A (Standard bindings)"
            >
              Layer A
            </button>
            <button
              type="button"
              onClick={() => onSwitchLayer(1)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeLayer === 1
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
              title="Secondary Layer B (Alternative bindings)"
            >
              Layer B
            </button>
          </div>
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
        {/* Global Hotkey Badge */}
        {globalHotkey && globalHotkey.enabled && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-[#131722] hover:bg-[#181E2C] border-[#202736] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer transition-colors"
            title="Global Deck Mode Toggle Shortcut (Click to customize in Settings)"
          >
            <span className="text-[10px] text-[#64748B] uppercase font-bold">Hotkey:</span>
            <span className="text-[#3B82F6] font-mono text-[11px] font-bold">
              {[...globalHotkey.modifiers.map((m) => m.toUpperCase()), globalHotkey.key].join('+')}
            </span>
          </button>
        )}

        {/* Target Keyboard Filter Pill with Live Connection Status */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-[#131722] border-[#202736]"
          title={
            isIsolated
              ? (isTargetConnected 
                  ? `Isolated to: ${activeDeviceName} (Connected)` 
                  : `Isolated to: ${activeDeviceName} (Disconnected — Pass-through active)`)
              : 'Affects all connected keyboards'
          }
        >
          <Keyboard 
            size={13} 
            className={
              isIsolated 
                ? (isTargetConnected ? 'text-[#3B82F6]' : 'text-[#F59E0B]') 
                : 'text-[#64748B]'
            } 
          />
          <span className="text-[#64748B] font-semibold text-[11px]">
            Device:{' '}
            <strong className={isIsolated ? (isTargetConnected ? 'text-[#3B82F6]' : 'text-[#F59E0B]') : 'text-[#94A3B8]'}>
              {isIsolated
                ? (activeDeviceName.length > 16 ? activeDeviceName.slice(0, 16) + '...' : activeDeviceName) + (isTargetConnected ? '' : ' ⚠️')
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
            isDeckMode
              ? 'bg-[#1D4ED8] hover:bg-[#2563EB] text-white border-[#3B82F6] shadow-md shadow-blue-500/20'
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
