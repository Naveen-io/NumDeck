import React, { useState } from 'react';
import { 
  Keyboard, 
  LayoutGrid, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Power, 
  Check 
} from 'lucide-react';

interface OnboardingModalProps {
  onStartCalibration: () => void;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onStartCalibration,
  onDismiss,
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-lg bg-[#111520] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#202736] flex items-center justify-between bg-[#0B0D12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
              <LayoutGrid size={15} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">NumDeck Setup</span>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] px-2 py-1 rounded cursor-pointer"
          >
            Skip Tour
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 bg-[#1A1F2B] w-full">
          <div
            className="h-full bg-[#3B82F6]"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-8 space-y-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
                <LayoutGrid size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider">Step 1 of 5</span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">Welcome to NumDeck</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  NumDeck transforms your computer's physical numeric keypad into an automated macro deck, 
                  bringing Stream Deck functionality to any laptop or USB keyboard.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: What It Does */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
                <Power size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider">Step 2 of 5</span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">Two Modes, One Keypad</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  Switch easily between <strong>Deck Mode</strong> (when you want to launch apps, adjust volume, and trigger hotkeys) 
                  and <strong>Normal Mode</strong> (when you need your standard number typing).
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Default Keyboard System */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider">Step 3 of 5</span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">Ready Out of the Box</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  The standard Windows keypad architecture is pre-configured. Standard laptop numpads and USB keypads work immediately with zero configuration required.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Optional Calibration */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
                <Keyboard size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider">Step 4 of 5</span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">Optional Calibration</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  If you have an unusual external keypad or customized hardware layout, you can calibrate individual physical keys anytime in Settings. 
                  Most users can skip calibration completely.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Complete & Credit */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                <Check size={26} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wider">Step 5 of 5</span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">You're Ready to Go!</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  Open My Deck to explore your default key assignments or customize actions for your favorite applications.
                </p>
              </div>

              {/* Creator Credit Badge */}
              <div className="pt-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0D12] border border-[#202736] text-xs text-[#E2E8F0] font-medium">
                  <span>NumDeck</span>
                  <span className="text-[#64748B]">·</span>
                  <span className="font-semibold text-[#3B82F6]">Made by Naveen</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#202736] flex items-center justify-between bg-[#0B0D12]">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="py-2 px-3 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="py-2 px-3 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#94A3B8] cursor-pointer"
            >
              Skip
            </button>
          )}

          <div className="flex items-center gap-2">
            {step === 4 && (
              <button
                onClick={() => {
                  onDismiss();
                  onStartCalibration();
                }}
                className="py-2 px-3 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] border border-[#2B3A54] hover:bg-[#182030] cursor-pointer"
              >
                Calibrate Now
              </button>
            )}

            <button
              onClick={nextStep}
              className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#3B82F6] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{step === totalSteps ? 'Get Started' : 'Next'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
