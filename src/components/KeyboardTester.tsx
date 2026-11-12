import React, { useState } from 'react';
import {
  HardwareDetectionReport,
  NumpadKey,
  NUMPAD_KEY_LABELS,
  RawKeyEvent,
} from '../types';
import {
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle2,
  Circle,
  Play,
  Square,
  Plus,
  Trash2,
  HelpCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface KeyTestEvent {
  id: string;
  key: NumpadKey;
  down: boolean;
  vk: number;
  scan: number;
  timestamp: string;
}

interface KeyboardTesterProps {
  detectionReport: HardwareDetectionReport | null;
  onRefreshHardware: () => void;
  recentTestEvents: KeyTestEvent[];
  lastTestedKey: NumpadKey | null;
  isDeckActive: boolean;
  onToggleDeckMode: () => void;
  lastRawKey?: RawKeyEvent | null;
  onToggleNumlock?: () => void;
  onSaveCustomMapping?: (signature: string, key: NumpadKey) => Promise<void>;
  onRemoveCustomMapping?: (signature: string) => Promise<void>;
  customMappings?: Record<string, NumpadKey>;
  isTestActive: boolean;
  onToggleTestMode: () => void;
}

const ALL_NUMPAD_KEYS: NumpadKey[] = [
  'num_lock', 'divide', 'multiply', 'subtract',
  'num7', 'num8', 'num9', 'plus',
  'num4', 'num5', 'num6',
  'num1', 'num2', 'num3', 'enter',
  'num0', 'decimal',
];

export const KeyboardTester: React.FC<KeyboardTesterProps> = ({
  detectionReport,
  onRefreshHardware,
  recentTestEvents,
  lastTestedKey,
  isDeckActive,
  onToggleDeckMode,
  lastRawKey,
  onToggleNumlock,
  onSaveCustomMapping,
  onRemoveCustomMapping,
  customMappings = {},
  isTestActive,
  onToggleTestMode,
}) => {
  // Track verified keys during this test session
  const [verifiedKeys, setVerifiedKeys] = useState<Map<NumpadKey, { vk: number; scan: number; timestamp: string }>>(new Map());
  const [selectedTargetKey, setSelectedTargetKey] = useState<NumpadKey>('num7');
  const [mappingMessage, setMappingMessage] = useState<string | null>(null);

  // Automatically update verified keys when valid numpad key is pressed
  React.useEffect(() => {
    if (lastRawKey && lastRawKey.mapped_key && lastRawKey.is_down) {
      const key = lastRawKey.mapped_key;
      setVerifiedKeys((prev) => {
        const next = new Map(prev);
        next.set(key, {
          vk: lastRawKey.vk,
          scan: lastRawKey.scan,
          timestamp: lastRawKey.timestamp,
        });
        return next;
      });
    }
  }, [lastRawKey]);

  const handleResetVerification = () => {
    setVerifiedKeys(new Map());
  };

  const handleAssignCurrentRawKey = async () => {
    if (!lastRawKey || !onSaveCustomMapping) return;
    const isExt = lastRawKey.is_extended;
    const scanByte = lastRawKey.scan_byte;
    const sig = `0x${lastRawKey.vk.toString(16).toUpperCase()}_0x${scanByte.toString(16).toUpperCase()}_${isExt}`;
    await onSaveCustomMapping(sig, selectedTargetKey);
    setMappingMessage(`Assigned signature ${sig} -> ${NUMPAD_KEY_LABELS[selectedTargetKey].name}`);
    setTimeout(() => setMappingMessage(null), 4000);
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '28px 36px',
        backgroundColor: '#090B0F',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Header with Title & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                Hardware Diagnostics & Keyboard Event Monitor
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: isTestActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isTestActive ? '#10B981' : '#EF4444',
                  border: isTestActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {isTestActive ? '● MONITORING LIVE' : '○ TEST PAUSED'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              Direct low-level Windows hook (<code style={{ color: '#60A5FA', fontFamily: 'Consolas' }}>WH_KEYBOARD_LL</code>) &amp; Raw Input diagnostic stream.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onToggleTestMode}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: isTestActive ? '#1E293B' : '#2563EB',
                border: isTestActive ? '1px solid #334155' : '1px solid #3B82F6',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isTestActive ? 'none' : '0 0 12px rgba(59, 130, 246, 0.4)',
              }}
            >
              {isTestActive ? <Square size={14} color="#EF4444" /> : <Play size={14} color="#FFFFFF" />}
              <span>{isTestActive ? 'Pause Event Monitor' : 'Start Keyboard Test'}</span>
            </button>

            <button
              onClick={onRefreshHardware}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: '#131722',
                border: '1px solid #232B3E',
                color: '#E2E8F0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={14} />
              <span>Rescan Hardware</span>
            </button>

            {onToggleNumlock && (
              <button
                onClick={onToggleNumlock}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#131722',
                  border: '1px solid #232B3E',
                  color: '#E2E8F0',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {detectionReport?.numlock_on ? <ToggleRight size={16} color="#10B981" /> : <ToggleLeft size={16} color="#F59E0B" />}
                <span>Toggle NumLock</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Status Cards: Device, NumLock, Interception */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {/* Card 1: Primary Keyboard Hardware Device */}
          <div
            style={{
              backgroundColor: '#10141D',
              padding: '16px 18px',
              borderRadius: '10px',
              border: '1px solid #1C2333',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hardware Device
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#F8FAFC',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={16} color="#38BDF8" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {detectionReport?.primary_device || 'Integrated Laptop Keyboard'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              {detectionReport?.keyboards_found || 1} Keyboard Interface(s) registered via RawInput
            </div>
          </div>

          {/* Card 2: NumLock Status */}
          <div
            style={{
              backgroundColor: '#10141D',
              padding: '16px 18px',
              borderRadius: '10px',
              border: '1px solid #1C2333',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              NumLock State
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: detectionReport?.numlock_on ? '#10B981' : '#F59E0B',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: detectionReport?.numlock_on ? '#10B981' : '#F59E0B',
                  boxShadow: detectionReport?.numlock_on ? '0 0 8px #10B981' : '0 0 8px #F59E0B',
                }}
              />
              <span>{detectionReport?.numlock_on ? 'Active (Numeric Mode)' : 'Off (Navigational Mode)'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Numpad Deck captures both states identically.
            </div>
          </div>

          {/* Card 3: Interception Mode */}
          <div
            style={{
              backgroundColor: '#10141D',
              padding: '16px 18px',
              borderRadius: '10px',
              border: '1px solid #1C2333',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Interception Engine
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isDeckActive ? '#3B82F6' : '#94A3B8',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={16} color={isDeckActive ? '#3B82F6' : '#64748B'} />
              <span>{isDeckActive ? 'Deck Mode Active' : 'Passthrough Mode'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              {isDeckActive ? 'Actions fire & suppress keys' : 'Normal Windows typing'}
            </div>
            <button
              onClick={onToggleDeckMode}
              style={{
                marginTop: '8px',
                padding: '4px 10px',
                borderRadius: '5px',
                backgroundColor: isDeckActive ? 'rgba(59, 130, 246, 0.2)' : '#19202E',
                border: isDeckActive ? '1px solid #3B82F6' : '1px solid #283348',
                color: isDeckActive ? '#93C5FD' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {isDeckActive ? 'Deactivate Deck Mode' : 'Activate Deck Mode'}
            </button>
          </div>
        </div>

        {/* 4. REAL-TIME CAPTURED KEY EVENT DIAGNOSTIC TABLE (Requirement #4) */}
        <div
          style={{
            backgroundColor: '#10141D',
            borderRadius: '12px',
            border: '1px solid #1F273A',
            padding: '20px 24px',
            boxShadow: lastRawKey ? '0 0 20px rgba(59, 130, 246, 0.08)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#38BDF8" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                Latest Captured Physical Key Press
              </span>
            </div>
            {lastRawKey && (
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Consolas' }}>
                Timestamp: {lastRawKey.timestamp}
              </span>
            )}
          </div>

          {lastRawKey ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #232B3E', color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px' }}>Detected Key</th>
                    <th style={{ padding: '8px 12px' }}>Virtual Key</th>
                    <th style={{ padding: '8px 12px' }}>Scan Code</th>
                    <th style={{ padding: '8px 12px' }}>Extended Flag</th>
                    <th style={{ padding: '8px 12px' }}>NumLock State</th>
                    <th style={{ padding: '8px 12px' }}>Event Type</th>
                    <th style={{ padding: '8px 12px' }}>Device Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.06)',
                      borderBottom: '1px solid #1F273A',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      {lastRawKey.mapped_key ? (
                        <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={16} />
                          <span>{lastRawKey.key_name}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#F59E0B' }}>
                          ⚠️ Unassigned (0x{lastRawKey.vk.toString(16).toUpperCase()})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'Consolas', color: '#F8FAFC' }}>
                      <strong>{lastRawKey.vk_name}</strong> (0x{lastRawKey.vk.toString(16).toUpperCase()})
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'Consolas', color: '#F8FAFC' }}>
                      0x{lastRawKey.scan_byte.toString(16).toUpperCase()} ({lastRawKey.scan_byte})
                      {lastRawKey.scan > 255 && (
                        <span style={{ color: '#64748B', marginLeft: '4px' }}>[raw: 0x{lastRawKey.scan.toString(16).toUpperCase()}]</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: lastRawKey.is_extended ? '#38BDF8' : '#94A3B8', fontFamily: 'Consolas' }}>
                      {lastRawKey.is_extended ? 'TRUE (Extended / 1)' : 'FALSE (Standard / 0)'}
                    </td>
                    <td style={{ padding: '12px', color: lastRawKey.numlock_on ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                      {lastRawKey.numlock_on ? 'ON' : 'OFF'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: lastRawKey.is_down ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                          color: lastRawKey.is_down ? '#60A5FA' : '#94A3B8',
                        }}
                      >
                        {lastRawKey.is_down ? 'KEY DOWN' : 'KEY UP'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94A3B8', fontSize: '12px' }}>
                      {lastRawKey.device_name || 'Integrated Keyboard'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Manual Mapping Quick-Bar if unassigned or user wants to rebind */}
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0A0D14',
                  border: '1px solid #1A2234',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <HelpCircle size={14} color="#60A5FA" />
                  <span style={{ color: '#94A3B8' }}>
                    Captured Signature: <strong style={{ color: '#FFFFFF', fontFamily: 'Consolas' }}>0x{lastRawKey.vk.toString(16).toUpperCase()}_0x{lastRawKey.scan_byte.toString(16).toUpperCase()}_{String(lastRawKey.is_extended)}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Map this input to:</span>
                  <select
                    value={selectedTargetKey}
                    onChange={(e) => setSelectedTargetKey(e.target.value as NumpadKey)}
                    style={{
                      backgroundColor: '#141A28',
                      border: '1px solid #2B3752',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    {ALL_NUMPAD_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {NUMPAD_KEY_LABELS[k].name} ({NUMPAD_KEY_LABELS[k].symbol})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssignCurrentRawKey}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#2563EB',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={12} />
                    <span>Save Mapping</span>
                  </button>
                </div>
              </div>

              {mappingMessage && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                  ✓ {mappingMessage}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Press any key on your physical numpad to see live hardware scan codes, virtual key codes, and extended flags...
            </div>
          )}
        </div>

        {/* 5. PHYSICAL KEYPAD VERIFICATION CHECKLIST (Requirement #5) */}
        <div
          style={{
            backgroundColor: '#10141D',
            borderRadius: '12px',
            border: '1px solid #1F273A',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                Physical Keyboard Verification Checklist
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                Press each physical key on your laptop numpad. It will turn green with a checkmark once verified.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: verifiedKeys.size === 17 ? '#10B981' : '#38BDF8' }}>
                Verified: {verifiedKeys.size} / 17 Physical Keys
              </div>
              <button
                onClick={handleResetVerification}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#181E2E',
                  border: '1px solid #2B3752',
                  color: '#94A3B8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Verification
              </button>
            </div>
          </div>

          {/* Verification Tiles Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
            }}
          >
            {ALL_NUMPAD_KEYS.map((k) => {
              const verifiedInfo = verifiedKeys.get(k);
              const isVerified = !!verifiedInfo;
              const isCurrentlyPressed = lastTestedKey === k;

              return (
                <div
                  key={k}
                  style={{
                    backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.12)' : '#0C0F17',
                    border: isCurrentlyPressed
                      ? '2px solid #3B82F6'
                      : isVerified
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid #1C2333',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transform: isCurrentlyPressed ? 'scale(0.96)' : 'none',
                    transition: 'all 0.1s ease',
                    boxShadow: isCurrentlyPressed ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isVerified ? '#FFFFFF' : '#94A3B8' }}>
                      {NUMPAD_KEY_LABELS[k].name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Consolas', marginTop: '2px' }}>
                      {isVerified
                        ? `VK: 0x${verifiedInfo.vk.toString(16).toUpperCase()} • Scan: 0x${verifiedInfo.scan.toString(16).toUpperCase()}`
                        : `Default: ${NUMPAD_KEY_LABELS[k].symbol}`}
                    </div>
                  </div>

                  {isVerified ? (
                    <CheckCircle2 size={18} color="#10B981" />
                  ) : (
                    <Circle size={16} color="#334155" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Active Custom Mappings List (If any exist) */}
        {Object.keys(customMappings).length > 0 && onRemoveCustomMapping && (
          <div
            style={{
              backgroundColor: '#10141D',
              borderRadius: '12px',
              border: '1px solid #1F273A',
              padding: '18px 22px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              Custom Laptop Key Mappings ({Object.keys(customMappings).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(customMappings).map(([sig, targetKey]) => (
                <div
                  key={sig}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#090B0F',
                    border: '1px solid #1C2333',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: '#60A5FA', fontFamily: 'Consolas', fontWeight: 600 }}>{sig}</span>
                    <span style={{ color: '#64748B', margin: '0 8px' }}>➔</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{NUMPAD_KEY_LABELS[targetKey]?.name || targetKey}</span>
                  </div>
                  <button
                    onClick={() => onRemoveCustomMapping(sig)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove custom mapping"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Real-Time Event Stream Log */}
        <div
          style={{
            backgroundColor: '#10141D',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #1F273A',
            display: 'flex',
            flexDirection: 'column',
            height: '320px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="#38BDF8" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Chronological Interception Log
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Events Captured: {recentTestEvents.length}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#07090D',
              borderRadius: '8px',
              border: '1px solid #161C28',
              padding: '8px',
              fontFamily: 'Consolas, monospace',
              fontSize: '11px',
            }}
          >
            {recentTestEvents.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0' }}>
                No events recorded yet. Press any key on your numpad to verify interception...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentTestEvents.slice(0, 40).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ev.down ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: ev.down ? '3px solid #3B82F6' : '3px solid #475569',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: '#94A3B8' }}>{ev.timestamp}</span>
                      <span style={{ color: ev.down ? '#60A5FA' : '#94A3B8', fontWeight: 600 }}>
                        {ev.down ? 'DOWN' : 'UP  '}
                      </span>
                      <span style={{ color: '#F8FAFC', fontWeight: 700 }}>
                        {NUMPAD_KEY_LABELS[ev.key]?.name || ev.key}
                      </span>
                    </div>
                    <div style={{ color: '#64748B', display: 'flex', gap: '10px' }}>
                      <span>VK: 0x{ev.vk.toString(16).toUpperCase()}</span>
                      <span>SCAN: 0x{ev.scan.toString(16).toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
