import React, { useState, useEffect, useRef } from 'react';
import { CalibrationProfile, KeySignature, ALL_NUMPAD_KEYS, domEventToNumpadKeyId } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  Keyboard, 
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
  isDeckMode?: boolean;
  onSave: (calibration: CalibrationProfile) => void;
  onCancel: () => void;
  onResetDefaults: () => void;
}

const KEY_LABELS: Record<string, string> = {
  numpad_numlock: 'NumLock',
  numpad_divide: 'Divide ( / )',
  numpad_multiply: 'Multiply ( * )',
  numpad_subtract: 'Subtract ( - )',
  numpad_7: '7 (Home)',
  numpad_8: '8 (Up Arrow)',
  numpad_9: '9 (Page Up)',
  numpad_add: 'Add ( + )',
  numpad_4: '4 (Left Arrow)',
  numpad_5: '5 (Clear)',
  numpad_6: '6 (Right Arrow)',
  numpad_1: '1 (End)',
  numpad_2: '2 (Down Arrow)',
  numpad_3: '3 (Page Down)',
  numpad_enter: 'Numpad Enter',
  numpad_0: '0 (Insert)',
  numpad_decimal: 'Decimal ( . )',
};

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  initialCalibration,
  numLockOn,
  isDeckMode = false,
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

  // Use refs to access latest values in persistent event handlers
  const stepIndexRef = useRef(currentStepIndex);
  stepIndexRef.current = currentStepIndex;

  const signaturesRef = useRef(capturedSignatures);
  signaturesRef.current = capturedSignatures;

  const isTestModeRef = useRef(isTestMode);
  isTestModeRef.current = isTestMode;

  const initialModeRef = useRef(isDeckMode ? 'Deck' : 'Normal');

  const targetKeyId = ALL_NUMPAD_KEYS[currentStepIndex];
  const targetKeyName = KEY_LABELS[targetKeyId] || targetKeyId;

  // 1. Enter Calibrating mode once on mount; cleanly restore previous mode on unmount
  useEffect(() => {
    invoke('set_engine_mode', { mode: 'Calibrating' }).catch(console.error);

    return () => {
      invoke('set_engine_mode', { mode: initialModeRef.current }).catch(console.error);
    };
  }, []);

  // Common handler for both Native Hook and DOM events
  const handleKeyCaptured = (sig: KeySignature) => {
    if (isTestModeRef.current) {
      const matched = Object.entries(signaturesRef.current).find(([, sigs]) =>
        sigs.some((s) => s.scan_code === sig.scan_code && s.is_extended === sig.is_extended)
      );
      if (matched) {
        setTestedKeys((prev) => ({ ...prev, [matched[0]]: true }));
      }
      return;
    }

    // Defensive check: reject system keys
    if (sig.vk_code === 0x5b || sig.vk_code === 0x5c) {
      setValidationWarning('Windows key detected. Please press the physical numeric keypad key.');
      setPendingSignature(null);
      return;
    }
    if (sig.vk_code === 0x1b) {
      setValidationWarning('Escape key detected. Press Cancel or press a key on your numeric keypad.');
      setPendingSignature(null);
      return;
    }
    if (sig.vk_code === 0x09) {
      return; // Ignore Tab navigation
    }
    if (sig.vk_code === 0xc0) {
      setValidationWarning('Tilde (~) key detected. Please press a key on your numeric keypad.');
      setPendingSignature(null);
      return;
    }
    if (sig.scan_code < 0x47 && sig.vk_code >= 0x30 && sig.vk_code <= 0x39) {
      setValidationWarning(`Top-row number '${String.fromCharCode(sig.vk_code)}' detected. Please press the physical numpad key.`);
      setPendingSignature(null);
      return;
    }

    const currentTarget = ALL_NUMPAD_KEYS[stepIndexRef.current];
    let warning: string | null = null;

    if (currentTarget === 'numpad_enter' && !sig.is_extended && sig.scan_code === 0x1c) {
      warning = 'Main keyboard Enter detected. Please press the numeric keypad Enter in the bottom right.';
    }

    setValidationWarning(warning);
    setPendingSignature(sig);
  };

  // 2. Persistent event listener registration (registered ONCE on mount)
  useEffect(() => {
    let unlistenCapture: (() => void) | undefined;

    const setup = async () => {
      try {
        unlistenCapture = await listen<KeySignature>('calibration-key-captured', (event) => {
          handleKeyCaptured(event.payload);
        });
      } catch (err) {
        console.warn('Backend event listen unavailable, falling back to DOM events:', err);
      }
    };

    setup();

    // DOM KeyDown backup interceptor for focused calibration
    const handleDomKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      const keyId = domEventToNumpadKeyId(e);
      if (keyId || e.location === 3 || e.code.startsWith('Numpad')) {
        e.preventDefault();
        e.stopPropagation();

        // Synthesize KeySignature from DOM event
        const vk = e.keyCode || e.which;
        const isExt = e.location === 3 && (e.code === 'NumpadEnter' || e.code === 'NumpadDivide');
        const defaultScan = getDefaultScanCode(keyId || e.code);

        handleKeyCaptured({
          vk_code: vk,
          scan_code: defaultScan,
          is_extended: isExt,
        });
      }
    };

    window.addEventListener('keydown', handleDomKeyDown, { capture: true });

    return () => {
      if (unlistenCapture) unlistenCapture();
      window.removeEventListener('keydown', handleDomKeyDown, { capture: true });
    };
  }, []);

  const confirmPendingKey = () => {
    if (!pendingSignature) return;

    setCapturedSignatures((prev) => {
      const existing = prev[targetKeyId] || [];
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
    <div className="fixed inset-0 bg-[#08090C]/80 flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0E1118] border border-[#1F2532] rounded-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F1F5F9]">Keypad Calibration</h2>
              <span className="text-[11px] text-[#64748B]">Optional setup for specialized hardware</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-[#64748B] hover:text-[#F1F5F9] p-1.5 rounded-lg hover:bg-[#182030] cursor-pointer"
            title="Cancel calibration"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[#1A1F2B] w-full">
          <div
            className="h-full bg-[#3B82F6]"
            style={{ width: `${((currentStepIndex + 1) / ALL_NUMPAD_KEYS.length) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 space-y-5">
          {!isTestMode ? (
            <>
              {/* Step instructions */}
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-semibold text-[#397BFF] uppercase tracking-wider">
                  Step {currentStepIndex + 1} of {ALL_NUMPAD_KEYS.length}
                </span>
                <h3 className="text-xl font-bold text-[#F4F6FA]">
                  Press <span className="text-[#397BFF]">{targetKeyName}</span>
                </h3>
                <p className="text-xs text-[#929CAC]">
                  Press the matching key on your physical keypad. NumLock is currently{' '}
                  <strong className={numLockOn ? 'text-[#65C991]' : 'text-[#E9B86A]'}>
                    {numLockOn ? 'ON' : 'OFF'}
                  </strong>.
                </p>
              </div>

              {/* Waiting or Captured Card */}
              {pendingSignature ? (
                <div className="p-5 rounded-xl bg-[#191E28] border border-[#397BFF]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#65C991] flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Key Detected Successfully
                    </span>
                    <span className="text-[11px] text-[#929CAC]">Ready to confirm</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#252C39] flex items-center justify-between text-xs">
                    <span className="text-[#929CAC]">Target Key:</span>
                    <span className="font-semibold text-[#F4F6FA]">{targetKeyName}</span>
                  </div>

                  {validationWarning && (
                    <div className="p-3 rounded-lg bg-[#E9B86A]/10 border border-[#E9B86A]/40 text-[#E9B86A] text-xs flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{validationWarning}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={confirmPendingKey}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Confirm & Next Key</span>
                    </button>
                    <button
                      onClick={handleRetry}
                      className="py-2 px-3 rounded-lg bg-[#12151C] hover:bg-[#252C39] border border-[#252C39] text-[#929CAC] hover:text-[#F4F6FA] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#0D0F14] border border-[#252C39] flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#191E28] border border-[#252C39] flex items-center justify-center text-[#397BFF]">
                    <Keyboard size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#F4F6FA] block">Waiting for physical key...</span>
                    <span className="text-xs text-[#626D7E]">Press {targetKeyName} on your numpad</span>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="py-1.5 px-3 rounded-lg text-xs text-[#929CAC] hover:text-[#F4F6FA] bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <SkipForward size={13} />
                    <span>Skip this key</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Test verification screen */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-[#65C991] flex items-center justify-center gap-1">
                  <CheckCircle2 size={15} /> All Keys Recorded
                </span>
                <h3 className="text-base font-bold text-[#F4F6FA]">Verify Keypad Detection</h3>
                <p className="text-xs text-[#929CAC]">
                  Press your numpad keys to confirm recognition. Recognized keys illuminate in green.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0F14] border border-[#252C39] flex justify-center">
                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: 'repeat(4, 52px)',
                    gridTemplateRows: 'repeat(5, 48px)',
                  }}
                >
                  {ALL_NUMPAD_KEYS.map((kId: string) => {
                    const isTested = testedKeys[kId];
                    const label = KEY_LABELS[kId]?.split(' ')[0] || kId;
                    return (
                      <div
                        key={kId}
                        className={`rounded-lg border flex flex-col items-center justify-center text-center p-1 ${
                          isTested
                            ? 'bg-[#65C991]/20 border-[#65C991] text-[#65C991]'
                            : 'bg-[#191E28] border-[#252C39] text-[#929CAC]'
                        }`}
                      >
                        <span className="text-[10px] font-semibold truncate max-w-full">{label}</span>
                        {isTested && <Check size={10} className="mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#929CAC] pt-1">
                <span>Recognized {Object.keys(testedKeys).length} of {ALL_NUMPAD_KEYS.length} keys</span>
                <button
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setIsTestMode(false);
                  }}
                  className="text-[#397BFF] hover:underline cursor-pointer"
                >
                  Recalibrate from Start
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <button
            onClick={onResetDefaults}
            className="py-1.5 px-3 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#EF4444] bg-[#181E2C] hover:bg-[#2F1D20] border border-[#202736] hover:border-[#EF4444]/40 cursor-pointer"
          >
            Reset to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="py-1.5 px-4 rounded-lg text-xs font-bold text-white bg-[#1D4ED8] hover:bg-[#2563EB] border border-[#3B82F6] flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Save Calibration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultScanCode(keyId: string): number {
  switch (keyId) {
    case 'numpad_numlock': return 0x45;
    case 'numpad_divide': return 0x35;
    case 'numpad_multiply': return 0x37;
    case 'numpad_subtract': return 0x4A;
    case 'numpad_7': return 0x47;
    case 'numpad_8': return 0x48;
    case 'numpad_9': return 0x49;
    case 'numpad_add': return 0x4E;
    case 'numpad_4': return 0x4B;
    case 'numpad_5': return 0x4C;
    case 'numpad_6': return 0x4D;
    case 'numpad_1': return 0x4F;
    case 'numpad_2': return 0x50;
    case 'numpad_3': return 0x51;
    case 'numpad_enter': return 0x1C;
    case 'numpad_0': return 0x52;
    case 'numpad_decimal': return 0x53;
    default: return 0x47;
  }
}
