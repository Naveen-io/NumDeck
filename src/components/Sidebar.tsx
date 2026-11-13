import React from 'react';
import { Home, LayoutGrid, Settings, Power } from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDeckMode: boolean;
  onToggleDeckMode: () => void;
  activeProfileName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDeckMode,
  onToggleDeckMode,
  activeProfileName,
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'deck' as NavTab, label: 'My Deck', icon: LayoutGrid },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#0B0D12] border-r border-[#1F2532] flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Brand & Top Header */}
      <div>
        <div className="h-14 px-5 border-b border-[#1F2532] flex items-center justify-between bg-[#0B0D12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#151923] border border-[#273042] flex items-center justify-center text-[#3B82F6]">
              <LayoutGrid size={15} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider text-[#F4F6FA] uppercase">NumDeck</span>
              <span className="text-[10px] text-[#64748B] font-medium leading-none">Stream Deck Controller</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                tabIndex={-1}
                onClick={(e) => {
                  onSelectTab(item.id);
                  e.currentTarget.blur();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-[#182030] text-[#3B82F6] border border-[#2B3A54]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121620] border border-transparent'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#3B82F6]' : 'text-[#64748B]'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mode Switch & Footer */}
      <div className="p-3 border-t border-[#1F2532] bg-[#0E1117] space-y-3">
        {/* Stream Deck Mode Toggle Card */}
        <div className="bg-[#131722] border border-[#202736] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider truncate max-w-[100px]" title={activeProfileName}>
              {activeProfileName}
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                isDeckMode
                  ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30'
                  : 'bg-[#1E2433] text-[#94A3B8] border-[#2A3347]'
              }`}
            >
              {isDeckMode ? 'Deck Active' : 'Normal'}
            </span>
          </div>

          <button
            tabIndex={-1}
            onClick={(e) => {
              onToggleDeckMode();
              e.currentTarget.blur();
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
              isDeckMode
                ? 'bg-[#1D4ED8] hover:bg-[#2563EB] text-white border-[#3B82F6]'
                : 'bg-[#181E2C] hover:bg-[#222B3E] text-[#E2E8F0] border-[#2A354C]'
            }`}
          >
            <Power size={13} strokeWidth={2.5} />
            <span>{isDeckMode ? 'Disable Deck Mode' : 'Enable Deck Mode'}</span>
          </button>
        </div>

        {/* Creator Credit */}
        <div className="text-center pt-1 pb-0.5">
          <span className="text-[11px] text-[#475569] font-medium">Made by Naveen</span>
        </div>
      </div>
    </aside>
  );
};
