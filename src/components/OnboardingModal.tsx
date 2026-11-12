import React, { useState, useEffect } from 'react';
import {
  HardwareDetectionReport,
  HotkeyConfig,
  NumpadKey,
  NUMPAD_KEY_LABELS,
} from '../types';
import {
  LayoutGrid,
  CheckCircle2,
  Cpu,
  Power,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { playSuccessChirp } from '../utils/sound';

interface OnboardingModalProps {
  onComplete: (hotkey: HotkeyConfig) => void;
  detectionReport: HardwareDetectionReport | null;
  onRefreshHardware?: () => void;
  lastTestedKey: NumpadKey | null;
  activationHotkey: HotkeyConfig;
  onToggleDeckMode: () => void;
  isDeckActive: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  detectionReport,
  lastTestedKey,
  activationHotkey,
  onToggleDeckMode,
  isDeckActive,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [testedKeys, setTestedKeys] = useState<Set<NumpadKey>>(new Set());
  const [hotkey, setHotkey] = useState<HotkeyConfig>(activationHotkey);

  useEffect(() => {
    if (lastTestedKey) {
      setTestedKeys((prev) => new Set(prev).add(lastTestedKey));
    }
  }, [lastTestedKey]);

  const handleFinish = () => {
    playSuccessChirp();
    onComplete(hotkey);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '100%',
          backgroundColor: '#11141B',
          borderRadius: '16px',
          border: '1px solid #232A3B',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Step Indicator Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #1A202E',
            backgroundColor: '#0D1016',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutGrid size={18} color="#3B82F6" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              Numpad Deck Setup
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: '28px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: step >= s ? '#3B82F6' : '#232A3B',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
              }}
            >
              <LayoutGrid size={32} color="#FFFFFF" />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Meet your new command centre.
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '380px', margin: '0 auto 28px' }}>
              Turn your unused laptop numpad into a customizable Stream Deck control surface.
            </p>

            {/* Visual illustration of a numpad */}
            <div
              style={{
                display: 'inline-grid',
                gridTemplateColumns: 'repeat(4, 32px)',
                gap: '5px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#0B0D12',
                border: '1px solid #1F2636',
                marginBottom: '32px',
              }}
            >
              {['NUM', '/', '*', '-'].map((k) => (
                <div key={k} style={{ height: '32px', backgroundColor: '#1A2130', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#38BDF8' }}>
                  {k}
                </div>
              ))}
              {['7', '8', '9', '+'].map((k) => (
                <div key={k} style={{ height: '32px', backgroundColor: '#1A2130', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#10B981' }}>
                  {k}
                </div>
              ))}
              {['4', '5', '6', 'ENT'].map((k) => (
                <div key={k} style={{ height: '32px', backgroundColor: '#1A2130', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#F59E0B' }}>
                  {k}
                </div>
              ))}
            </div>

            <div>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '12px 32px',
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                }}
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Detect Keyboard */}
        {step === 2 && (
          <div style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              Detect your keyboard
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
              We inspect your physical input hardware and verify numeric keypad responsiveness.
            </p>

            {/* Hardware Status Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: '#161B26',
                border: '1px solid #232C3E',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Cpu size={22} color="#3B82F6" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                    {detectionReport?.numpad_ready
                      ? 'Physical Keyboard Interface Active'
                      : 'Scanning Input Devices...'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {detectionReport?.keyboards_found || 1} hardware keyboard(s) discovered • NumLock State: {detectionReport?.numlock_on ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
              <CheckCircle2 size={20} color="#10B981" />
            </div>

            {/* Interactive Key Test Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: '#0D1016',
                border: '1px solid #1E2536',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
                Press any physical numpad key right now to test:
              </div>

              {/* Mini Interactive Numpad Map */}
              <div
                style={{
                  display: 'inline-grid',
                  gridTemplateColumns: 'repeat(4, 40px)',
                  gap: '6px',
                  marginBottom: '10px',
                }}
              >
                {(
                  [
                    'num_lock',
                    'divide',
                    'multiply',
                    'subtract',
                    'num7',
                    'num8',
                    'num9',
                    'plus',
                    'num4',
                    'num5',
                    'num6',
                    'enter',
                    'num1',
                    'num2',
                    'num3',
                    'decimal',
                    'num0',
                  ] as NumpadKey[]
                ).map((k) => {
                  const wasTested = testedKeys.has(k);
                  const isCurrent = lastTestedKey === k;
                  const label = NUMPAD_KEY_LABELS[k];
                  return (
                    <div
                      key={k}
                      style={{
                        height: '36px',
                        borderRadius: '6px',
                        border: isCurrent
                          ? '1px solid #60A5FA'
                          : wasTested
                          ? '1px solid #10B981'
                          : '1px solid #232A3B',
                        backgroundColor: isCurrent
                          ? '#2563EB'
                          : wasTested
                          ? '#10B98125'
                          : '#161B26',
                        color: isCurrent || wasTested ? '#FFFFFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        transition: 'all 0.1s ease',
                        gridColumn: k === 'num0' ? 'span 2' : undefined,
                      }}
                    >
                      {label.symbol}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '11px', color: testedKeys.size > 0 ? '#34D399' : '#64748B' }}>
                {testedKeys.size > 0
                  ? `✓ Tested ${testedKeys.size} numpad key(s). Hardware response verified!`
                  : 'Awaiting your key press...'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure Deck Mode */}
        {step === 3 && (
          <div style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              Configure Deck Mode
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
              Deck Mode intercepts your physical numpad to fire custom macros. When disabled, your numpad types numbers as usual.
            </p>

            {/* Toggle Shortcut Config Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: '#161B26',
                border: '1px solid #232C3E',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '10px' }}>
                Global Activation Shortcut:
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {(['ctrl', 'alt', 'shift'] as const).map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setHotkey({ ...hotkey, [mod]: !hotkey[mod] })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: hotkey[mod] ? '#2563EB' : '#1C2230',
                      border: '1px solid #2E384D',
                      color: hotkey[mod] ? '#FFFFFF' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {mod.toUpperCase()}
                  </button>
                ))}

                <select
                  value={hotkey.key}
                  onChange={(e) => setHotkey({ ...hotkey, key: e.target.value })}
                  style={{
                    backgroundColor: '#1C2230',
                    border: '1px solid #2E384D',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                >
                  {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '18px' }}>
                Press your activation shortcut anytime to enable Deck Mode. Your numpad will execute your assigned actions. Press it again to restore normal numpad behaviour.
              </p>
            </div>

            {/* Test Activation Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#0D1016',
                border: '1px solid #1E2536',
                marginBottom: '24px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC' }}>
                  Live Mode Test:
                </div>
                <div style={{ fontSize: '11px', color: isDeckActive ? '#34D399' : '#94A3B8' }}>
                  Current State: {isDeckActive ? 'DECK ACTIVE' : 'NORMAL NUMPAD'}
                </div>
              </div>

              <button
                onClick={onToggleDeckMode}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: isDeckActive ? '#10B98125' : '#1F2636',
                  border: isDeckActive ? '1px solid #10B981' : '1px solid #334155',
                  color: isDeckActive ? '#34D399' : '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Power size={14} />
                <span>Toggle State</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                style={{
                  padding: '12px 28px',
                  borderRadius: '8px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Sparkles size={16} />
                <span>Open My Deck</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
