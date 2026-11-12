import React, { useState, useEffect } from 'react';
import { DiagnosticEvent } from '../types';
import { listen } from '@tauri-apps/api/event';
import { 
  Activity, 
  Trash2, 
  Pause, 
  Play, 
  Filter, 
  Cpu, 
  ShieldCheck, 
  Keyboard
} from 'lucide-react';

interface DiagnosticViewerProps {
  numLockOn: boolean;
  isDeckMode: boolean;
}

export const DiagnosticViewer: React.FC<DiagnosticViewerProps> = ({
  numLockOn,
  isDeckMode,
}) => {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterOnlySuppressed, setFilterOnlySuppressed] = useState(false);
  const [filterOnlyNumpad, setFilterOnlyNumpad] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<DiagnosticEvent>('diagnostic-key-event', (event) => {
        if (!isPaused) {
          setEvents((prev) => [event.payload, ...prev.slice(0, 199)]); // keep latest 200 events
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [isPaused]);

  const filteredEvents = events.filter((ev) => {
    if (filterOnlySuppressed && !ev.is_suppressed) return false;
    if (filterOnlyNumpad && !ev.matched_logical_key) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090C] overflow-hidden select-none">
      {/* Diagnostics Header & Hardware Status Banner */}
      <div className="p-6 border-b border-[#252C39] bg-[#0D0F14] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#397BFF]/15 border border-[#397BFF]/40 flex items-center justify-center text-[#397BFF]">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F6FA]">Hardware Keyboard Event Inspector</h2>
              <p className="text-xs text-[#929CAC]">
                Live low-level Windows KBDLLHOOKSTRUCT stream — Inspect every keystroke, scan code, and flag
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isPaused
                  ? 'bg-[#E9B86A]/20 text-[#E9B86A] border-[#E9B86A]/50'
                  : 'bg-[#191E28] hover:bg-[#252C39] text-[#929CAC] hover:text-[#F4F6FA] border-[#252C39]'
              }`}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused ? 'Resume Feed' : 'Pause Feed'}</span>
            </button>

            <button
              onClick={() => setEvents([])}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#191E28] hover:bg-[#252C39] text-[#929CAC] hover:text-[#ED7777] border border-[#252C39] flex items-center gap-1.5 transition-all"
            >
              <Trash2 size={13} />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Metrics Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <span className="text-[10px] font-mono text-[#626D7E] uppercase block">Hardware NumLock</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${numLockOn ? 'bg-[#65C991]' : 'bg-[#E9B86A]'}`} />
              <span className="text-xs font-bold text-[#F4F6FA] font-mono">
                {numLockOn ? 'TOGGLED ON' : 'TOGGLED OFF'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <span className="text-[10px] font-mono text-[#626D7E] uppercase block">Hook Engine Status</span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck size={14} className="text-[#65C991]" />
              <span className="text-xs font-bold text-[#F4F6FA] font-mono">WH_KEYBOARD_LL ACTIVE</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <span className="text-[10px] font-mono text-[#626D7E] uppercase block">Deck Suppression</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isDeckMode ? 'bg-[#397BFF]' : 'bg-[#626D7E]'}`} />
              <span className="text-xs font-bold text-[#F4F6FA] font-mono">
                {isDeckMode ? 'SUPPRESSING CALIBRATED' : 'PASS-THROUGH ONLY'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <span className="text-[10px] font-mono text-[#626D7E] uppercase block">Events Captured</span>
            <div className="flex items-center gap-2 mt-1">
              <Cpu size={14} className="text-[#397BFF]" />
              <span className="text-xs font-bold text-[#F4F6FA] font-mono">{events.length} Keystrokes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#252C39]/60 text-xs text-[#929CAC]">
          <span className="flex items-center gap-1.5 font-semibold text-[#626D7E]">
            <Filter size={13} /> Filters:
          </span>
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F6FA]">
            <input
              type="checkbox"
              checked={filterOnlySuppressed}
              onChange={(e) => setFilterOnlySuppressed(e.target.checked)}
              className="rounded bg-[#191E28] border-[#252C39] text-[#397BFF] focus:ring-0"
            />
            <span>Only Suppressed Keys</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#F4F6FA]">
            <input
              type="checkbox"
              checked={filterOnlyNumpad}
              onChange={(e) => setFilterOnlyNumpad(e.target.checked)}
              className="rounded bg-[#191E28] border-[#252C39] text-[#397BFF] focus:ring-0"
            />
            <span>Only Matched Numpad Keys</span>
          </label>
        </div>
      </div>

      {/* Live Event Table */}
      <div className="flex-1 overflow-auto p-6">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#626D7E]">
            <Keyboard size={40} className="mb-3 opacity-30 text-[#397BFF]" />
            <h3 className="text-sm font-semibold text-[#929CAC] mb-1">No Keystrokes Logged</h3>
            <p className="text-xs max-w-sm">
              Press any key on your keyboard to inspect its raw Windows event structure in real time.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#252C39] bg-[#0D0F14] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#12151C] text-[#626D7E] border-b border-[#252C39] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Key Name</th>
                  <th className="py-2.5 px-3">VK Code</th>
                  <th className="py-2.5 px-3">Scan Code</th>
                  <th className="py-2.5 px-3">Extended</th>
                  <th className="py-2.5 px-3">Injected</th>
                  <th className="py-2.5 px-3">NumLock</th>
                  <th className="py-2.5 px-3">Matched Key</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252C39]/60">
                {filteredEvents.map((ev, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#191E28]/50 transition-colors ${
                      ev.is_suppressed ? 'bg-[#397BFF]/5' : ''
                    }`}
                  >
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.event_type === 'keydown'
                            ? 'bg-[#397BFF]/20 text-[#397BFF]'
                            : 'bg-[#626D7E]/20 text-[#929CAC]'
                        }`}
                      >
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#F4F6FA]">{ev.vk_name}</td>
                    <td className="py-2 px-3 text-[#929CAC]">
                      0x{ev.vk_code.toString(16).toUpperCase()} ({ev.vk_code})
                    </td>
                    <td className="py-2 px-3 font-bold text-[#F4F6FA]">
                      0x{ev.scan_code.toString(16).toUpperCase()} ({ev.scan_code})
                    </td>
                    <td className="py-2 px-3">
                      <span className={ev.is_extended ? 'text-[#397BFF] font-bold' : 'text-[#626D7E]'}>
                        {ev.is_extended ? '1 (Extended)' : '0'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={ev.is_injected ? 'text-[#ED7777] font-bold' : 'text-[#626D7E]'}>
                        {ev.is_injected ? 'Synthetic' : 'Physical'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={ev.numlock_on ? 'text-[#65C991]' : 'text-[#E9B86A]'}>
                        {ev.numlock_on ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {ev.matched_logical_key ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#191E28] border border-[#252C39] text-[#65C991] font-semibold">
                          {ev.matched_logical_key}
                        </span>
                      ) : (
                        <span className="text-[#626D7E]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.is_suppressed
                            ? 'bg-[#ED7777]/20 text-[#ED7777] border border-[#ED7777]/30'
                            : 'bg-[#626D7E]/10 text-[#626D7E]'
                        }`}
                      >
                        {ev.is_suppressed ? 'Suppressed' : 'Passed Through'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
