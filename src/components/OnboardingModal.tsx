import React from 'react';
import { 
  Crosshair, 
  ArrowRight,
  Keyboard
} from 'lucide-react';

interface OnboardingModalProps {
  onStartCalibration: () => void;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onStartCalibration,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 bg-[#08090C]/85 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-lg bg-[#0D0F14] border border-[#252C39] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top graphic */}
        <div className="p-8 pb-4 text-center space-y-3 bg-gradient-to-b from-[#14264A]/30 to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-[#397BFF]/15 border border-[#397BFF]/40 flex items-center justify-center text-[#397BFF] mx-auto shadow-lg">
            <Keyboard size={30} />
          </div>
          <h1 className="text-xl font-black text-[#F4F6FA] tracking-tight">
            Welcome to NUMPAD DECK
          </h1>
          <p className="text-xs text-[#929CAC] max-w-sm mx-auto leading-relaxed">
            Transform your physical numeric keypad into an automated, hardware-accelerated macro deck.
          </p>
        </div>

        {/* Core steps summary */}
        <div className="p-8 pt-2 space-y-3 text-xs">
          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <div className="w-7 h-7 rounded-lg bg-[#397BFF]/20 text-[#397BFF] flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <strong className="text-[#F4F6FA] font-semibold block mb-0.5">Calibrate Physical Hardware</strong>
              <span className="text-[#929CAC] leading-tight block">
                Press each numpad key once. We capture exact Windows scan codes to separate numpad keys from top-row numbers.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <div className="w-7 h-7 rounded-lg bg-[#65C991]/20 text-[#65C991] flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <strong className="text-[#F4F6FA] font-semibold block mb-0.5">Assign Custom Actions</strong>
              <span className="text-[#929CAC] leading-tight block">
                Assign apps, websites, media controls, multi-action macros, and shortcuts to any key.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
            <div className="w-7 h-7 rounded-lg bg-[#E9B86A]/20 text-[#E9B86A] flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <strong className="text-[#F4F6FA] font-semibold block mb-0.5">Toggle Deck Mode On & Off</strong>
              <span className="text-[#929CAC] leading-tight block">
                Switch to Deck Mode when you want macro power; switch back to Normal when you need normal number typing.
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 border-t border-[#252C39] bg-[#12151C]/60 flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] px-3 py-2 transition-all"
          >
            Explore with Standard Defaults
          </button>

          <button
            onClick={onStartCalibration}
            className="py-2.5 px-5 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Crosshair size={14} />
            <span>Calibrate My Numpad</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
