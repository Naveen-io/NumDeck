import React from 'react';
import { 
  LayoutGrid, 
  Layers, 
  Crosshair, 
  Activity, 
  Settings, 
  ShieldAlert,
  Power,
  Info
} from 'lucide-react';

export type NavTab = 'deck' | 'profiles' | 'calibration' | 'diagnostics' | 'settings' | 'about';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDeckMode: boolean;
  onToggleDeckMode: () => void;
  isCalibrated: boolean;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDeckMode,
  onToggleDeckMode,
  isCalibrated,
}) => {
  const navItems: NavItem[] = [
    { id: 'deck', label: 'Deck Workspace', icon: LayoutGrid },
    { id: 'profiles', label: 'Profiles', icon: Layers },
    { id: 'calibration', label: 'Hardware Calibration', icon: Crosshair, badge: !isCalibrated ? 'Calibrate' : undefined },
    { id: 'diagnostics', label: 'Key Diagnostics', icon: Activity },
    { id: 'settings', label: 'Settings & Fail-Safe', icon: Settings },
    { id: 'about', label: 'About & Hardware Info', icon: Info },
  ];

  return (
    <aside className="w-64 bg-[#0D0F14] border-r border-[#252C39] flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Top Header with Brand Identity */}
      <div>
        <div className="p-4 border-b border-[#252C39] bg-[#0A0C10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="NUMPAD DECK" className="h-8 object-contain" />
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#191E28] text-[#F4F6FA] border border-[#252C39] shadow-sm'
                    : 'text-[#929CAC] hover:text-[#F4F6FA] hover:bg-[#12151C] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-[#397BFF]' : 'text-[#626D7E]'} strokeWidth={2} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E9B86A]/20 text-[#E9B86A] border border-[#E9B86A]/40 rounded-md">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-[#252C39] bg-[#0A0C10] space-y-3">
        {/* Tactile Hardware Deck Mode Toggle */}
        <div className="bg-[#12151C] border border-[#252C39] rounded-xl p-3 shadow-inner">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono font-bold text-[#929CAC] uppercase tracking-wider">
              Control Engine
            </span>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                isDeckMode
                  ? 'bg-[#397BFF]/20 text-[#397BFF] border-[#397BFF]/50 shadow-[0_0_8px_rgba(57,123,255,0.3)]'
                  : 'bg-[#191E28] text-[#626D7E] border-[#252C39]'
              }`}
            >
              {isDeckMode ? 'Deck Active' : 'Normal'}
            </span>
          </div>

          <button
            onClick={onToggleDeckMode}
            className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isDeckMode
                ? 'bg-[#397BFF] text-white hover:bg-[#5B91FF]'
                : 'bg-[#191E28] text-[#F4F6FA] hover:bg-[#252C39] border border-[#252C39]'
            }`}
          >
            <Power size={14} strokeWidth={2.5} />
            <span>{isDeckMode ? 'Switch to Normal Mode' : 'Switch to Deck Mode'}</span>
          </button>
        </div>

        {/* Emergency disarm fail-safe */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#191E28]/50 border border-[#252C39] text-[#929CAC]">
          <ShieldAlert size={15} className="text-[#ED7777] shrink-0 mt-0.5" strokeWidth={2} />
          <div className="text-[11px] leading-snug">
            <strong className="text-[#F4F6FA] font-semibold block">Emergency Fail-Safe</strong>
            <span>Triple-tap <kbd className="px-1 py-0.5 bg-[#0D0F14] text-[#ED7777] rounded border border-[#252C39] font-mono font-bold">ESC 3×</kbd> to disarm instantly.</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
