import React, { useState, useEffect } from 'react';
import { CalibrationProfile, KeySignature, DiagnosticEvent, ALL_NUMPAD_KEYS } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  Crosshair, 
  Check, 
  RotateCcw, 
  SkipForward, 
  X, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';

interface CalibrationWizardProps {
  initialCalibration: CalibrationProfile;
  numLockOn: boolean;
  onSave: (calibration: CalibrationProfile) => void;
  onCancel: () => void;
  onResetDefaults: () => void;
}

const KEY_LABELS: Record<string, string> = {
  numpad_numlock: 'NumLock',
  numpad_divide: 'Numpad / (Divide)',
  numpad_multiply: 'Numpad * (Multiply)',
  numpad_subtract: 'Numpad - (Subtract)',
  numpad_7: 'Numpad 7 (or Home)',
  numpad_8: 'Numpad 8 (or Up Arrow)',
  numpad_9: 'Numpad 9 (or PgUp)',
  numpad_add: 'Numpad + (Add)',
  numpad_4: 'Numpad 4 (or Left Arrow)',
  numpad_5: 'Numpad 5 (or Clear)',
  numpad_6: 'Numpad 6 (or Right Arrow)',
  numpad_1: 'Numpad 1 (or End)',
  numpad_2: 'Numpad 2 (or Down Arrow)',
  numpad_3: 'Numpad 3 (or PgDn)',
  numpad_enter: 'Numpad Enter (Bottom Right)',
  numpad_0: 'Numpad 0 (or Insert)',
  numpad_decimal: 'Numpad . (Decimal or Del)',
};

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  initialCalibration,
  numLockOn,
  onSave,
  onCancel,
  onResetDefaults,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedSignatures, setCapturedSignatures] = useState<Record<string, KeySignature[]>>(
    initialCalibration.signatures || {}
  );
  const [pendingSignature, setPendingSignature] = useState<KeySignature | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testedKeys, setTestedKeys] = useState<Record<string, boolean>>({});

  const targetKeyId = ALL_NUMPAD_KEYS[currentStepIndex];
  const targetKeyName = KEY_LABELS[targetKeyId] || targetKeyId;

  // Switch engine to Calibrating mode while wizard is open
  useEffect(() => {
    invoke('set_engine_mode', { mode: 'Calibrating' }).catch(console.error);

    return () => {
      // Revert to Normal mode on unmount
      invoke('set_engine_mode', { mode: 'Normal' }).catch(console.error);
    };
  }, []);

  // Listen for captured key events from the backend hook
  useEffect(() => {
    let unlistenCapture: (() => void) | undefined;
    let unlistenDiag: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenCapture = await listen<KeySignature>('calibration-key-captured', (event) => {
        const sig = event.payload;

        if (isTestMode) {
          // In test mode: check which key was pressed
          const matched = Object.entries(capturedSignatures).find(([, sigs]) =>
            sigs.some((s) => s.scan_code === sig.scan_code && s.is_extended === sig.is_extended)
          );
          if (matched) {
            setTestedKeys((prev) => ({ ...prev, [matched[0]]: true }));
          }
          return;
        }

        // Validate candidate key
        let warning: string | null = null;

        // Check if user pressed main keyboard Enter instead of Numpad Enter
        if (targetKeyId === 'numpad_enter' && !sig.is_extended && sig.scan_code === 0x1c) {
          warning = 'Warning: This event matches Main Enter (Ext=0). Please press the numeric keypad Enter (Ext=1).';
        }

        // Check if user pressed top-row numbers
        if (sig.scan_code < 0x47 && sig.vk_code >= 0x30 && sig.vk_code <= 0x39) {
          warning = `Warning: This appears to be top-row '${String.fromCharCode(sig.vk_code)}'. Please press physical numpad key.`;
        }

        // Check for duplicate assignment
        const existingKey = Object.entries(capturedSignatures).find(
          ([kId, sigs]) =>
            kId !== targetKeyId &&
            sigs.some((s) => s.scan_code === sig.scan_code && s.is_extended === sig.is_extended)
        );

        if (existingKey) {
          warning = `Notice: This signature was already assigned to ${KEY_LABELS[existingKey[0]] || existingKey[0]}. Re-assigning will overwrite it.`;
        }

        setValidationWarning(warning);
        setPendingSignature(sig);
      });

      unlistenDiag = await listen<DiagnosticEvent>('diagnostic-key-event', () => {});
    };

    setupListeners();

    return () => {
      if (unlistenCapture) unlistenCapture();
      if (unlistenDiag) unlistenDiag();
    };
  }, [currentStepIndex, targetKeyId, capturedSignatures, isTestMode]);

  const confirmPendingKey = () => {
    if (!pendingSignature) return;

    setCapturedSignatures((prev) => {
      const existing = prev[targetKeyId] || [];
      // Avoid duplicate signature entries in the same key
      const filtered = existing.filter(
        (s) => s.scan_code !== pendingSignature.scan_code || s.is_extended !== pendingSignature.is_extended
      );
      return {
        ...prev,
        [targetKeyId]: [...filtered, pendingSignature],
      };
    });

    setPendingSignature(null);
    setValidationWarning(null);

    // Advance to next key
    if (currentStepIndex < ALL_NUMPAD_KEYS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsTestMode(true);
    }
  };

  const handleSkip = () => {
    setPendingSignature(null);
    setValidationWarning(null);
    if (currentStepIndex < ALL_NUMPAD_KEYS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsTestMode(true);
    }
  };

  const handleRetry = () => {
    setPendingSignature(null);
    setValidationWarning(null);
  };

  const handleSaveAll = () => {
    const updated: CalibrationProfile = {
      signatures: capturedSignatures,
      calibrated_at: new Date().toISOString(),
      is_completed: true,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-[#08090C]/80 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#0D0F14] border border-[#252C39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#397BFF]/15 border border-[#397BFF]/40 flex items-center justify-center text-[#397BFF]">
              <Crosshair size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F6FA]">Hardware Keypad Calibration</h2>
              <p className="text-xs text-[#929CAC]">
                Capture actual physical keyboard signatures to distinguish numpad from main keys
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#626D7E] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#12151C] w-full">
          <div
            className="h-full bg-[#397BFF] transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / ALL_NUMPAD_KEYS.length) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          {!isTestMode ? (
            <>
              {/* Step instructions */}
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-semibold uppercase text-[#397BFF]">
                  Step {currentStepIndex + 1} of {ALL_NUMPAD_KEYS.length}
                </span>
                <h3 className="text-2xl font-black text-[#F4F6FA] tracking-tight">
                  Press <span className="text-[#397BFF]">{targetKeyName}</span>
                </h3>
                <p className="text-xs text-[#929CAC] max-w-md mx-auto">
                  Press the indicated physical key on your numeric keypad. Current NumLock status:{' '}
                  <strong className={numLockOn ? 'text-[#65C991]' : 'text-[#E9B86A]'}>
                    {numLockOn ? 'ON' : 'OFF'}
                  </strong>.
                </p>
              </div>

              {/* Waiting or Captured Card */}
              {pendingSignature ? (
                <div className="p-5 rounded-2xl bg-[#12151C] border border-[#397BFF]/50 shadow-inner space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#65C991] flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Keystroke Captured!
                    </span>
                    <span className="text-[11px] font-mono text-[#929CAC]">
                      Timestamp: {Date.now().toString().slice(-6)}
                    </span>
                  </div>

                  {/* Hardware data chips */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-[#08090C] border border-[#252C39]">
                      <span className="text-[10px] text-[#626D7E] block uppercase font-mono">Scan Code</span>
                      <span className="text-sm font-mono font-bold text-[#F4F6FA]">
                        0x{pendingSignature.scan_code.toString(16).toUpperCase()} ({pendingSignature.scan_code})
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#08090C] border border-[#252C39]">
                      <span className="text-[10px] text-[#626D7E] block uppercase font-mono">Extended Key</span>
                      <span className="text-sm font-mono font-bold text-[#F4F6FA]">
                        {pendingSignature.is_extended ? 'Yes (1)' : 'No (0)'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#08090C] border border-[#252C39]">
                      <span className="text-[10px] text-[#626D7E] block uppercase font-mono">Virtual Key</span>
                      <span className="text-sm font-mono font-bold text-[#F4F6FA]">
                        0x{pendingSignature.vk_code.toString(16).toUpperCase()} ({pendingSignature.vk_code})
                      </span>
                    </div>
                  </div>

                  {/* Warning banner if questionable */}
                  {validationWarning && (
                    <div className="p-3 rounded-lg bg-[#E9B86A]/10 border border-[#E9B86A]/40 text-[#E9B86A] text-xs flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <span>{validationWarning}</span>
                    </div>
                  )}

                  {/* Confirmation actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={confirmPendingKey}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      <span>Confirm & Next Key</span>
                    </button>
                    <button
                      onClick={handleRetry}
                      className="py-2.5 px-4 rounded-xl bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] text-[#F4F6FA] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Recapture</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#12151C] border border-dashed border-[#252C39] flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#191E28] flex items-center justify-center text-[#397BFF] animate-pulse">
                    <Crosshair size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#F4F6FA] block">Listening for physical keypress...</span>
                    <span className="text-xs text-[#626D7E]">Press the physical numpad key now</span>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSkip}
                      className="py-1.5 px-3 rounded-lg text-xs text-[#929CAC] hover:text-[#F4F6FA] bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] flex items-center gap-1.5 transition-all"
                    >
                      <SkipForward size={13} />
                      <span>Skip this key</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Calibration Verification Playground */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold uppercase text-[#65C991] flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Calibration Recorded
                </span>
                <h3 className="text-lg font-bold text-[#F4F6FA]">Test Calibration Playground</h3>
                <p className="text-xs text-[#929CAC]">
                  Press your physical numpad keys below. Keys that illuminate green are successfully recognized!
                </p>
              </div>

              {/* Mini keypad test visualizer */}
              <div className="p-6 rounded-2xl bg-[#12151C] border border-[#252C39] flex justify-center">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: 'repeat(4, 56px)',
                    gridTemplateRows: 'repeat(5, 52px)',
                  }}
                >
                  {ALL_NUMPAD_KEYS.map((kId: string) => {
                    const isTested = testedKeys[kId];
                    const label = KEY_LABELS[kId]?.split(' ')[0] || kId;
                    return (
                      <div
                        key={kId}
                        className={`rounded-lg border flex flex-col items-center justify-center text-center p-1 transition-all ${
                          isTested
                            ? 'bg-[#65C991]/20 border-[#65C991] text-[#65C991] shadow-[0_0_10px_#65C991]'
                            : 'bg-[#191E28] border-[#252C39] text-[#929CAC]'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold truncate max-w-full">{label}</span>
                        {isTested && <Check size={10} className="mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#929CAC] px-2">
                <span>Recognized {Object.keys(testedKeys).length} of {ALL_NUMPAD_KEYS.length} keys</span>
                <button
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setIsTestMode(false);
                  }}
                  className="text-[#397BFF] hover:underline"
                >
                  Restart Calibration Wizard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <button
            onClick={onResetDefaults}
            className="py-2 px-3 rounded-lg text-xs font-semibold text-[#929CAC] hover:text-[#ED7777] bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] transition-all"
            title="Reset calibration to standard PC hardware defaults"
          >
            Reset to Standard Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="py-2 px-4 rounded-lg text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] bg-transparent transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="py-2 px-5 rounded-lg text-xs font-bold text-white bg-[#397BFF] hover:bg-[#5B91FF] shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Apply & Finish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
