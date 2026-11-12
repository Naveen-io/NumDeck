import React from 'react';
import {
  HardwareDetectionReport,
  NumpadKey,
  NUMPAD_KEY_LABELS,
} from '../types';
import {
  Cpu,
  RefreshCw,
  Terminal,
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
}

export const KeyboardTester: React.FC<KeyboardTesterProps> = ({
  detectionReport,
  onRefreshHardware,
  recentTestEvents,
  lastTestedKey,
  isDeckActive,
}) => {

  return (
    <div
      style={{
        flex: 1,
        padding: '32px',
        backgroundColor: '#0B0D12',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Diagnostics & Keyboard Hardware Tester
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              Verify low-level Windows keyboard hook interception, scan codes, and NumLock status in real time.
            </p>
          </div>

          <button
            onClick={onRefreshHardware}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#1E2536',
              border: '1px solid #2B3448',
              color: '#F8FAFC',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            <span>Scan Hardware</span>
          </button>
        </div>

        {/* Status Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#12151C',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #1F2432',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              NumLock State
            </div>
            <div
              style={{
                fontSize: '18px',
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
                }}
              />
              <span>{detectionReport?.numlock_on ? 'Active (Numbers)' : 'Off (Navigational)'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Numpad Deck captures both states identically.
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#12151C',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #1F2432',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Interception Engine
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: isDeckActive ? '#3B82F6' : '#94A3B8',
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
                  backgroundColor: isDeckActive ? '#3B82F6' : '#64748B',
                }}
              />
              <span>{isDeckActive ? 'Deck Interception Active' : 'Passthrough Mode'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              WH_KEYBOARD_LL Windows Hook
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#12151C',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #1F2432',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Discovered Devices
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#F8FAFC',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={18} color="#38BDF8" />
              <span>{detectionReport?.keyboards_found || 1} Keyboard Device(s)</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Direct RawInput Query
            </div>
          </div>
        </div>

        {/* Live Visual Numpad Board & Event Stream in 2 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
          {/* Visual Numpad interactive map */}
          <div
            style={{
              backgroundColor: '#12151C',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #1F2432',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Interactive Keypad
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
              Press keys on your physical numpad to light them up:
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              {/* Row 1 */}
              {(['num_lock', 'divide', 'multiply', 'subtract'] as NumpadKey[]).map((k) => {
                const isDown = lastTestedKey === k;
                return (
                  <div
                    key={k}
                    style={{
                      height: '52px',
                      borderRadius: '8px',
                      backgroundColor: isDown ? '#2563EB' : '#181C26',
                      border: isDown ? '2px solid #60A5FA' : '1px solid #283042',
                      color: isDown ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      transform: isDown ? 'scale(0.94)' : 'none',
                      transition: 'all 0.1s ease',
                      boxShadow: isDown ? '0 0 15px #3B82F6' : 'none',
                    }}
                  >
                    <span>{NUMPAD_KEY_LABELS[k].symbol}</span>
                  </div>
                );
              })}

              {/* Row 2 */}
              {(['num7', 'num8', 'num9', 'plus'] as NumpadKey[]).map((k) => {
                const isDown = lastTestedKey === k;
                return (
                  <div
                    key={k}
                    style={{
                      height: '52px',
                      borderRadius: '8px',
                      backgroundColor: isDown ? '#10B981' : '#181C26',
                      border: isDown ? '2px solid #34D399' : '1px solid #283042',
                      color: isDown ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      transform: isDown ? 'scale(0.94)' : 'none',
                      transition: 'all 0.1s ease',
                      boxShadow: isDown ? '0 0 15px #10B981' : 'none',
                    }}
                  >
                    <span>{NUMPAD_KEY_LABELS[k].symbol}</span>
                  </div>
                );
              })}

              {/* Row 3 */}
              {(['num4', 'num5', 'num6', 'enter'] as NumpadKey[]).map((k) => {
                const isDown = lastTestedKey === k;
                return (
                  <div
                    key={k}
                    style={{
                      height: '52px',
                      borderRadius: '8px',
                      backgroundColor: isDown ? '#8B5CF6' : '#181C26',
                      border: isDown ? '2px solid #A78BFA' : '1px solid #283042',
                      color: isDown ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      transform: isDown ? 'scale(0.94)' : 'none',
                      transition: 'all 0.1s ease',
                      boxShadow: isDown ? '0 0 15px #8B5CF6' : 'none',
                    }}
                  >
                    <span>{NUMPAD_KEY_LABELS[k].symbol}</span>
                  </div>
                );
              })}

              {/* Row 4 */}
              {(['num1', 'num2', 'num3', 'decimal'] as NumpadKey[]).map((k) => {
                const isDown = lastTestedKey === k;
                return (
                  <div
                    key={k}
                    style={{
                      height: '52px',
                      borderRadius: '8px',
                      backgroundColor: isDown ? '#F59E0B' : '#181C26',
                      border: isDown ? '2px solid #FBBF24' : '1px solid #283042',
                      color: isDown ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      transform: isDown ? 'scale(0.94)' : 'none',
                      transition: 'all 0.1s ease',
                      boxShadow: isDown ? '0 0 15px #F59E0B' : 'none',
                    }}
                  >
                    <span>{NUMPAD_KEY_LABELS[k].symbol}</span>
                  </div>
                );
              })}

              {/* Row 5: 0 spans 2 columns */}
              <div
                style={{
                  gridColumn: '1 / 3',
                  height: '52px',
                  borderRadius: '8px',
                  backgroundColor: lastTestedKey === 'num0' ? '#EC4899' : '#181C26',
                  border: lastTestedKey === 'num0' ? '2px solid #F472B6' : '1px solid #283042',
                  color: lastTestedKey === 'num0' ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  transform: lastTestedKey === 'num0' ? 'scale(0.94)' : 'none',
                  transition: 'all 0.1s ease',
                  boxShadow: lastTestedKey === 'num0' ? '0 0 15px #EC4899' : 'none',
                }}
              >
                0 (Zero)
              </div>
            </div>
          </div>

          {/* Real-time Event Stream Table */}
          <div
            style={{
              backgroundColor: '#12151C',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #1F2432',
              display: 'flex',
              flexDirection: 'column',
              height: '380px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="#38BDF8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Live Interception Log
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Events: {recentTestEvents.length}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#090B0F',
                borderRadius: '8px',
                border: '1px solid #191E2A',
                padding: '8px',
                fontFamily: 'Consolas, monospace',
                fontSize: '11px',
              }}
            >
              {recentTestEvents.length === 0 ? (
                <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0' }}>
                  Press any physical numpad key to observe low-level interception events...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recentTestEvents.slice(0, 30).map((ev) => (
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
    </div>
  );
};
