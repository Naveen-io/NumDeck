import React from 'react';
import { 
  LayoutGrid, 
  Layers, 
  Crosshair, 
  Activity, 
  Settings, 
  ShieldAlert,
  Power
} from 'lucide-react';

export type NavTab = 'deck' | 'profiles' | 'calibration' | 'diagnostics' | 'settings';

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
    { id: 'calibration', label: 'Hardware Calibration', icon: Crosshair, badge: !isCalibrated ? 'Needed' : undefined },
    { id: 'diagnostics', label: 'Key Diagnostics', icon: Activity },
    { id: 'settings', label: 'Settings & Emergency', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0D0F14] border-r border-[#252C39] flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-[#252C39] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#397BFF]/15 border border-[#397BFF]/40 flex items-center justify-center text-[#397BFF] font-black text-sm tracking-tighter shadow-sm">
              NUM
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-[#F4F6FA] uppercase">Numpad Deck</h1>
              <span className="text-[11px] text-[#626D7E] font-medium tracking-tight">Hardware Controller</span>
            </div>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#191E28] text-[#F4F6FA] border border-[#252C39] shadow-inner'
                    : 'text-[#929CAC] hover:text-[#F4F6FA] hover:bg-[#12151C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-[#397BFF]' : 'text-[#626D7E]'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#E9B86A]/20 text-[#E9B86A] border border-[#E9B86A]/40 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Deck Mode & Emergency Controls */}
      <div className="p-4 border-t border-[#252C39] bg-[#0A0C10] space-y-3">
        {/* Quick Mode Toggle */}
        <div className="bg-[#12151C] border border-[#252C39] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#929CAC] uppercase tracking-wider">Engine Mode</span>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                isDeckMode
                  ? 'bg-[#397BFF]/20 text-[#397BFF] border-[#397BFF]/50'
                  : 'bg-[#626D7E]/20 text-[#929CAC] border-[#252C39]'
              }`}
            >
              {isDeckMode ? 'Deck Active' : 'Normal'}
            </span>
          </div>

          <button
            onClick={onToggleDeckMode}
            className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all shadow-sm ${
              isDeckMode
                ? 'bg-[#397BFF] text-white hover:bg-[#5B91FF]'
                : 'bg-[#191E28] text-[#F4F6FA] hover:bg-[#252C39] border border-[#252C39]'
            }`}
          >
            <Power size={14} />
            <span>{isDeckMode ? 'Switch to Normal' : 'Switch to Deck Mode'}</span>
          </button>
        </div>

        {/* Emergency recovery tip */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#191E28]/50 border border-[#252C39]/80 text-[#929CAC]">
          <ShieldAlert size={15} className="text-[#ED7777] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <strong className="text-[#F4F6FA] font-medium block">Emergency Exit</strong>
            <span>Press <kbd className="px-1 py-0.5 bg-[#12151C] text-[#ED7777] rounded border border-[#252C39] font-mono">ESC 3×</kbd> to instantly restore normal keyboard.</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
