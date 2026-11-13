import React from 'react';
import { 
  LayoutGrid, 
  Power, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { Profile } from '../types';

interface HomeViewProps {
  isDeckMode: boolean;
  onToggleDeckMode: () => void;
  numLockOn: boolean;
  activeProfile: Profile;
  profiles: Profile[];
  onSelectProfile: (id: string) => void;
  onNavigateToDeck: () => void;
  onNavigateToSettings: () => void;
  onOpenCalibration: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  isDeckMode,
  onToggleDeckMode,
  numLockOn,
  activeProfile,
  profiles,
  onSelectProfile,
  onNavigateToDeck,
  onNavigateToSettings,
  onOpenCalibration,
}) => {
  const configuredKeyCount = Object.values(activeProfile.keys || {}).filter((k) => !!k.action).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#08090C] text-[#F4F6FA] select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-8 border-b border-[#1F2532] bg-[#0B0D12] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-[#F4F6FA]">Overview</h1>
          <span className="text-[11px] text-[#64748B]">Keypad status and quick actions</span>
        </div>

        <div className="flex items-center gap-3">
          {/* NumLock status pill */}
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-[#11151F] border-[#1F2532]"
            title={numLockOn ? "NumLock is ON (Numbers active)" : "NumLock is OFF (Navigation active)"}
          >
            <span className={`w-2 h-2 rounded-full ${numLockOn ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
            <span className="text-[#94A3B8]">
              NumLock: <strong className={numLockOn ? 'text-[#10B981]' : 'text-[#F59E0B]'}>{numLockOn ? 'ON' : 'OFF'}</strong>
            </span>
          </div>

          {/* Quick Deck Mode Toggle */}
          <button
            onClick={onToggleDeckMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
              isDeckMode
                ? 'bg-[#1D4ED8] hover:bg-[#2563EB] text-white border-[#3B82F6]'
                : 'bg-[#151923] hover:bg-[#1E2433] text-[#94A3B8] hover:text-[#F1F5F9] border-[#252D3D]'
            }`}
          >
            <Power size={13} strokeWidth={2.5} />
            <span>{isDeckMode ? 'Deck Mode Active' : 'Normal Mode'}</span>
          </button>
        </div>
      </header>

      {/* Main Home Content */}
      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Hero Status Banner */}
        <div className="p-6 rounded-2xl bg-[#111520] border border-[#202736] flex items-center justify-between shadow-sm">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDeckMode ? 'bg-[#3B82F6]' : 'bg-[#64748B]'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                {isDeckMode ? 'Stream Deck Mode is Active' : 'Normal Keyboard Mode is Active'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">
              {isDeckMode
                ? 'Your numeric keypad is running as a Stream Deck'
                : 'Your numeric keypad functions as a normal number pad'}
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {isDeckMode
                ? 'Press any numpad key to trigger your mapped applications, media shortcuts, and macros.'
                : 'Toggle Deck Mode whenever you want to activate your custom action bindings.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onNavigateToDeck}
              className="py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <LayoutGrid size={15} />
              <span>Open My Deck</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={onToggleDeckMode}
              className="py-2 px-4 rounded-xl bg-[#182030] hover:bg-[#202B40] text-[#E2E8F0] text-xs font-semibold border border-[#2B3A54] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Power size={13} />
              <span>{isDeckMode ? 'Switch to Normal Mode' : 'Activate Deck Mode'}</span>
            </button>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Profile Card */}
          <div className="p-5 rounded-xl bg-[#10141D] border border-[#1E2534] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Active Profile</span>
                <span className="px-2 py-0.5 rounded bg-[#182030] text-[#3B82F6] border border-[#28364E] text-[10px] font-bold">
                  {configuredKeyCount} of 17 configured
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F1F5F9] mb-1">{activeProfile.name}</h3>
              <p className="text-xs text-[#94A3B8]">
                Switch profiles to change your button layout for gaming, coding, editing, or everyday tasks.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1C2331] flex items-center justify-between">
              <select
                value={activeProfile.id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="bg-[#151A26] border border-[#263042] rounded-lg px-2.5 py-1 text-xs font-medium text-[#E2E8F0] cursor-pointer focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onNavigateToDeck}
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Deck</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Keypad Input Status Card */}
          <div className="p-5 rounded-xl bg-[#10141D] border border-[#1E2534] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Input Engine</span>
                <span className="flex items-center gap-1 text-[11px] text-[#10B981] font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Ready</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F1F5F9] mb-1">Standard Windows Numpad</h3>
              <p className="text-xs text-[#94A3B8]">
                Built-in laptop numeric keypads and external USB keypads work out of the box with zero setup required.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1C2331] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">Optional Calibration</span>
              <button
                onClick={onOpenCalibration}
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] cursor-pointer"
              >
                Calibrate Keypad
              </button>
            </div>
          </div>

          {/* Safety & Controls Card */}
          <div className="p-5 rounded-xl bg-[#10141D] border border-[#1E2534] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Fail-Safe</span>
                <span className="flex items-center gap-1 text-[11px] text-[#10B981] font-semibold">
                  <ShieldCheck size={13} />
                  <span>Enabled</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F1F5F9] mb-1">Triple-ESC Disarm</h3>
              <p className="text-xs text-[#94A3B8]">
                Press the Escape key three times quickly anytime to instantly disarm Deck Mode and restore normal keyboard input.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1C2331] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">Preferences</span>
              <button
                onClick={onNavigateToSettings}
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 cursor-pointer"
              >
                <span>Settings</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Instructions / Feature Guide */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
            How NumDeck Works
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0D1017] border border-[#1C222E] space-y-1.5">
              <span className="text-xs font-bold text-[#F1F5F9] block">1. Switch Between Modes</span>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Toggle Deck Mode on when you are streaming, gaming, or working. Switch back to Normal Mode whenever you need regular numbers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1017] border border-[#1C222E] space-y-1.5">
              <span className="text-xs font-bold text-[#F1F5F9] block">2. Assign Custom Actions</span>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Open My Deck and click any key to bind applications, website URLs, hotkey combos, volume controls, or frequently typed text snippets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1017] border border-[#1C222E] space-y-1.5">
              <span className="text-xs font-bold text-[#F1F5F9] block">3. Separate Profiles</span>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Organize your decks by activity—General, Coding, Gaming, Streaming, and Video Editing—each with its own 17-key layout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
