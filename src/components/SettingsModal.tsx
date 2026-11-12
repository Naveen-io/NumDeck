import React from 'react';
import { AppSettings } from '../types';
import { 
  X, 
  ShieldAlert, 
  Volume2, 
  RotateCcw, 
  Info,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetCalibration: () => void;
  onClose: () => void;
  isCalibrated: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetCalibration,
  onClose,
  isCalibrated,
}) => {
  return (
    <div className="fixed inset-0 bg-[#08090C]/80 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#0D0F14] border border-[#252C39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <div>
            <h2 className="text-base font-bold text-[#F4F6FA]">Settings & Hardware Architecture</h2>
            <p className="text-xs text-[#929CAC]">System configuration, fail-safe emergency controls, and hardware details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#626D7E] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Emergency Recovery Panel */}
          <div className="p-5 rounded-2xl bg-[#ED7777]/10 border border-[#ED7777]/30 space-y-3">
            <div className="flex items-center gap-2.5 text-[#ED7777]">
              <ShieldAlert size={18} />
              <h3 className="text-sm font-bold">Emergency Fail-Safe Recovery</h3>
            </div>
            <p className="text-xs text-[#929CAC] leading-relaxed">
              If an unexpected macro or loop occurs in Deck Mode, NUMPAD DECK includes an unblockable low-level hardware safeguard:
            </p>
            <div className="p-3 rounded-xl bg-[#08090C] border border-[#252C39] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F4F6FA] block">Emergency Disarm Shortcut</span>
                <span className="text-[11px] text-[#626D7E]">Triple-tap ESC in under 1.2 seconds</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#191E28] border border-[#ED7777]/40 text-[#ED7777] font-mono text-xs font-bold shadow-inner">
                ESC × 3
              </div>
            </div>
            <p className="text-[11px] text-[#626D7E]">
              Pressing ESC 3 times immediately sets the engine to Normal Mode, unhooks key suppression, clears key state tracking, and restores your keyboard completely.
            </p>
          </div>

          {/* Preferences */}
          <div className="p-5 rounded-2xl bg-[#12151C] border border-[#252C39] space-y-4">
            <h3 className="text-xs font-bold text-[#929CAC] uppercase tracking-wider">Preferences</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Volume2 size={16} className="text-[#397BFF]" />
                <div>
                  <span className="text-xs font-bold text-[#F4F6FA] block">Audio Feedback on Keystroke</span>
                  <span className="text-[11px] text-[#626D7E]">Produce subtle tactile audio click when a deck action triggers</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sound_feedback}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sound_feedback: e.target.checked })
                }
                className="w-4 h-4 rounded bg-[#191E28] border-[#252C39] text-[#397BFF] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#252C39]/60">
              <div className="flex items-center gap-3">
                <ShieldAlert size={16} className="text-[#65C991]" />
                <div>
                  <span className="text-xs font-bold text-[#F4F6FA] block">Fail-Safe Emergency Monitor</span>
                  <span className="text-[11px] text-[#626D7E]">Enable hardware triple-ESC emergency disarm</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emergency_shortcut_enabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, emergency_shortcut_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded bg-[#191E28] border-[#252C39] text-[#397BFF] focus:ring-0"
              />
            </label>
          </div>

          {/* Hardware & Calibration Reset */}
          <div className="p-5 rounded-2xl bg-[#12151C] border border-[#252C39] space-y-3">
            <h3 className="text-xs font-bold text-[#929CAC] uppercase tracking-wider">Hardware Calibration State</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F4F6FA] block">
                  Status: {isCalibrated ? 'Calibrated & Verified' : 'Standard Fallback Signatures'}
                </span>
                <span className="text-[11px] text-[#626D7E]">
                  Restore built-in standard PC keyboard scan code definitions (Scan 0x47-0x53)
                </span>
              </div>
              <button
                onClick={onResetCalibration}
                className="py-1.5 px-3 rounded-lg bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] flex items-center gap-1.5 transition-all"
              >
                <RotateCcw size={13} />
                <span>Reset Signatures</span>
              </button>
            </div>
          </div>

          {/* Windows Privilege Boundary Note */}
          <div className="p-4 rounded-xl bg-[#191E28]/40 border border-[#252C39] flex items-start gap-3">
            <Info size={16} className="text-[#397BFF] shrink-0 mt-0.5" />
            <div className="text-xs text-[#929CAC] space-y-1">
              <strong className="text-[#F4F6FA] block">Windows UIPI Privilege Boundary Note</strong>
              <p>
                Windows User Interface Privilege Isolation prevents standard user applications from sending simulated keystrokes into elevated Administrator windows (e.g. Task Manager or elevated consoles). To send hotkeys into elevated applications, run NUMPAD DECK as Administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#252C39] bg-[#12151C]/60 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
