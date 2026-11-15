import React, { useState } from 'react';
import { 
  Sliders, 
  Keyboard, 
  Palette, 
  Info, 
  RotateCcw, 
  CheckCircle2, 
  Check,
  RefreshCw,
  Crosshair,
  Radio,
  Usb,
  Laptop
} from 'lucide-react';
import { AppSettings, CalibrationProfile, KeyboardDeviceInfo } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  calibration: CalibrationProfile;
  numLockOn: boolean;
  onOpenCalibration: () => void;
  onResetCalibration: () => void;
  connectedKeyboards?: KeyboardDeviceInfo[];
  onRefreshKeyboards?: () => void;
  isDetectingKeyboard?: boolean;
  onStartDetectingKeyboard?: () => void;
  onStopDetectingKeyboard?: () => void;
}

type SettingsSection = 'general' | 'input' | 'appearance' | 'about';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  calibration,
  numLockOn,
  onOpenCalibration,
  onResetCalibration,
  connectedKeyboards = [],
  onRefreshKeyboards,
  isDetectingKeyboard = false,
  onStartDetectingKeyboard,
  onStopDetectingKeyboard,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    showNotice('Preferences saved');
  };

  const showNotice = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const isCalibratedCustom = calibration?.is_completed && !!calibration.calibrated_at;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#08090C] text-[#F4F6FA] select-none">
      {/* Top Header */}
      <header className="h-14 px-8 border-b border-[#1F2532] bg-[#0B0D12] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-[#F4F6FA]">Settings</h1>
          <span className="text-[11px] text-[#64748B]">Application and hardware preferences</span>
        </div>

        {saveNotice && (
          <span className="flex items-center gap-1.5 text-xs text-[#10B981] font-medium bg-[#10B981]/10 px-2.5 py-1 rounded-md border border-[#10B981]/30">
            <Check size={12} />
            <span>{saveNotice}</span>
          </span>
        )}
      </header>

      {/* Main Settings Body with Sub-Navigation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Settings Navigation Sidebar */}
        <div className="w-56 border-r border-[#1F2532] bg-[#0B0D12] p-3 space-y-1 shrink-0">
          <button
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSection === 'general'
                ? 'bg-[#182030] text-[#3B82F6] border border-[#2B3A54]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121620] border border-transparent'
            }`}
          >
            <Sliders size={15} />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveSection('input')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSection === 'input'
                ? 'bg-[#182030] text-[#3B82F6] border border-[#2B3A54]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121620] border border-transparent'
            }`}
          >
            <Keyboard size={15} />
            <span>Keyboard & Input</span>
          </button>

          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSection === 'appearance'
                ? 'bg-[#182030] text-[#3B82F6] border border-[#2B3A54]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121620] border border-transparent'
            }`}
          >
            <Palette size={15} />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveSection('about')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSection === 'about'
                ? 'bg-[#182030] text-[#3B82F6] border border-[#2B3A54]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121620] border border-transparent'
            }`}
          >
            <Info size={15} />
            <span>About</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
          {/* GENERAL SETTINGS */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">General Preferences</h2>
                <p className="text-xs text-[#94A3B8]">Configure launch behavior and application preferences.</p>
              </div>

              <div className="space-y-3">
                {/* Run on Startup */}
                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Start with Windows</span>
                    <span className="text-xs text-[#94A3B8] block">
                      Automatically launch NumDeck in the background when your computer boots up.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.run_at_startup}
                      onChange={(e) => updateSetting('run_at_startup', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#1F2637] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

                {/* Minimize to Tray */}
                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Minimize to System Tray</span>
                    <span className="text-xs text-[#94A3B8] block">
                      Keep NumDeck running in the Windows notification tray when closing the window.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.minimize_to_tray}
                      onChange={(e) => updateSetting('minimize_to_tray', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#1F2637] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

                {/* Sound Feedback */}
                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Audio Feedback on Key Press</span>
                    <span className="text-xs text-[#94A3B8] block">
                      Play a subtle click sound whenever an action is triggered on your keypad.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sound_feedback}
                      onChange={(e) => updateSetting('sound_feedback', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#1F2637] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

                {/* Emergency Shortcut */}
                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Triple-Escape Emergency Disarm</span>
                    <span className="text-xs text-[#94A3B8] block">
                      Pressing the Escape key three times in rapid succession immediately disarms Deck Mode.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emergency_shortcut_enabled}
                      onChange={(e) => updateSetting('emergency_shortcut_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#1F2637] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* KEYBOARD & INPUT SETTINGS */}
          {activeSection === 'input' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Keyboard & Input</h2>
                <p className="text-xs text-[#94A3B8]">Manage keypad input detection and hardware calibration.</p>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F1F5F9]">Hardware Connection Status</span>
                  <span className="flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
                    <CheckCircle2 size={13} /> Connected & Ready
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0C0F17] border border-[#1E2535]">
                    <span className="text-[#64748B] block text-[11px] mb-1">Physical NumLock</span>
                    <span className="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${numLockOn ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                      {numLockOn ? 'NumLock ON' : 'NumLock OFF'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0C0F17] border border-[#1E2535]">
                    <span className="text-[#64748B] block text-[11px] mb-1">Keypad Layout</span>
                    <span className="font-bold text-[#F1F5F9]">
                      {isCalibratedCustom ? 'Custom Calibrated' : 'Standard Factory Defaults'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Keyboard Filter (Device Isolation) */}
              <div className="p-5 rounded-xl bg-[#111520] border border-[#202736] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#F1F5F9]">Target Keyboard (Device Isolation)</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
                        {settings.target_keyboard_device && settings.target_keyboard_device !== 'all' ? 'Isolated' : 'All Keyboards'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Choose which physical keyboard NumDeck intercepts. If you use a separate USB numeric keypad, select it here so your main laptop/desktop keyboard types normally and is never suppressed.
                    </p>
                  </div>

                  {onRefreshKeyboards && (
                    <button
                      onClick={onRefreshKeyboards}
                      className="p-2 rounded-lg bg-[#182030] hover:bg-[#202B40] border border-[#2B3A54] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer shrink-0 transition-colors"
                      title="Rescan connected keyboards"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <select
                        value={settings.target_keyboard_device || 'all'}
                        onChange={(e) => updateSetting('target_keyboard_device', e.target.value === 'all' ? undefined : e.target.value)}
                        className="w-full bg-[#0C0F17] hover:bg-[#131722] border border-[#2B3A54] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-xs font-semibold text-[#F1F5F9] cursor-pointer focus:outline-none transition-colors"
                      >
                        <option value="all">All Keyboards (Default — Any connected keypad)</option>
                        {connectedKeyboards.map((kb) => (
                          <option key={kb.id} value={kb.id}>
                            {kb.name} {kb.is_internal ? '— Laptop' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isDetectingKeyboard ? (
                      <button
                        onClick={onStopDetectingKeyboard}
                        className="py-2 px-3.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold cursor-pointer shrink-0 animate-pulse flex items-center gap-1.5"
                      >
                        <Radio size={13} className="animate-spin" />
                        <span>Tap any key on numpad... (Cancel)</span>
                      </button>
                    ) : (
                      <button
                        onClick={onStartDetectingKeyboard}
                        className="py-2 px-3.5 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] border border-[#3B82F6] text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors"
                        title="Press any key on your numpad to detect and select it"
                      >
                        <Crosshair size={13} />
                        <span>Detect Keypad</span>
                      </button>
                    )}
                  </div>

                  {/* Connected devices summary */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-[#64748B] font-medium">Connected hardware:</span>
                    {connectedKeyboards.length === 0 ? (
                      <span className="text-[11px] text-[#94A3B8] italic">Scanning USB ports...</span>
                    ) : (
                      connectedKeyboards.map((kb) => {
                        const isSelected = settings.target_keyboard_device === kb.id;
                        return (
                          <button
                            key={kb.id}
                            onClick={() => updateSetting('target_keyboard_device', isSelected ? undefined : kb.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA]'
                                : 'bg-[#0C0F17] border-[#1E2535] text-[#94A3B8] hover:border-[#2B3A54] hover:text-[#F1F5F9]'
                            }`}
                          >
                            {kb.is_internal ? <Laptop size={11} /> : <Usb size={11} />}
                            <span>{kb.name}</span>
                            {isSelected && <Check size={11} className="text-[#3B82F6] ml-0.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Calibration Controls */}
              <div className="p-5 rounded-xl bg-[#111520] border border-[#202736] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F1F5F9]">Keypad Hardware Calibration</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Calibration is optional. Standard numeric keypads and laptop numpads work automatically out of the box. 
                    If you use an uncommon or non-standard external keypad, run calibration to bind its physical keys.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={onOpenCalibration}
                    className="py-2 px-4 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Start Keypad Calibration
                  </button>
                  <button
                    onClick={onResetCalibration}
                    className="py-2 px-4 rounded-lg bg-[#182030] hover:bg-[#202B40] border border-[#2B3A54] text-[#E2E8F0] text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Reset to Factory Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Appearance</h2>
                <p className="text-xs text-[#94A3B8]">Customize the visual style of your Deck workspace.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Interface Theme</span>
                    <span className="text-xs text-[#94A3B8] block">Dark Slate (Elgato Stream Deck style)</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#182030] text-[#3B82F6] border border-[#2B3A54] text-xs font-semibold">
                    Dark Mode (Active)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#111520] border border-[#202736] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#F1F5F9] block">Key Pad Display Proportions</span>
                    <span className="text-xs text-[#94A3B8] block">Proportional numpad layout with tall Enter and Add keys.</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#182030] text-[#3B82F6] border border-[#2B3A54] text-xs font-semibold">
                    Proportional (Active)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SETTINGS */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">About NumDeck</h2>
                <p className="text-xs text-[#94A3B8]">Application information and credits.</p>
              </div>

              {/* Application Details Card */}
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202736] space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#1E2535]">
                  <div className="w-10 h-10 rounded-xl bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
                    <Keyboard size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F8FAFC]">NumDeck</h3>
                    <span className="text-xs text-[#3B82F6] font-semibold">Version 1.0.0 (Release)</span>
                  </div>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  NumDeck transforms any physical numeric keypad into a customizable Stream Deck.
                  Assign application launches, multimedia controls, complex hotkeys, and frequently typed text macros
                  to individual numpad keys while maintaining full support for everyday keyboard use.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-[#0C0F17] border border-[#1E2535]">
                    <span className="text-[#64748B] block text-[11px] mb-0.5">Platform</span>
                    <span className="font-bold text-[#F1F5F9]">Windows 10 / 11 (x64)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0C0F17] border border-[#1E2535]">
                    <span className="text-[#64748B] block text-[11px] mb-0.5">Engine Architecture</span>
                    <span className="font-bold text-[#F1F5F9]">Tauri 2 + Native Rust</span>
                  </div>
                </div>

                {/* Tasteful Creator Credit */}
                <div className="pt-4 border-t border-[#1E2535] flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Created for everyday desktop productivity</span>
                  <div className="px-3 py-1 rounded-lg bg-[#182030] border border-[#2B3A54] text-xs font-semibold text-[#F1F5F9]">
                    Made by Naveen
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
