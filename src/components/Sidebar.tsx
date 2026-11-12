import React from 'react';
import {
  Layers,
  LayoutGrid,
  Settings as SettingsIcon,
  Activity,
  Zap,
  Power,
} from 'lucide-react';
import { DeckState } from '../types';

interface SidebarProps {
  currentTab: 'deck' | 'profiles' | 'actions' | 'tester' | 'settings';
  setCurrentTab: (tab: 'deck' | 'profiles' | 'actions' | 'tester' | 'settings') => void;
  deckState: DeckState;
  onToggleDeckMode: () => void;
  onSelectProfile: (profileId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  deckState,
  onToggleDeckMode,
  onSelectProfile,
}) => {
  const isDeckActive = deckState.is_deck_active;

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#0F1218',
        borderRight: '1px solid #1F2430',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* App Branding */}
      <div
        style={{
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #1A1F2B',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <LayoutGrid size={20} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', color: '#F8FAFC' }}>
            Numpad Deck
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>v1.0</span>
            <span>•</span>
            <span>Windows Control</span>
          </div>
        </div>
      </div>

      {/* Deck Mode Toggle Card */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1A1F2B' }}>
        <button
          onClick={onToggleDeckMode}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: isDeckActive ? '1px solid #10B981' : '1px solid #2B3345',
            background: isDeckActive
              ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : '#161A23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isDeckActive ? '#10B981' : '#64748B',
                boxShadow: isDeckActive ? '0 0 10px #10B981' : 'none',
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isDeckActive ? '#34D399' : '#94A3B8' }}>
                {isDeckActive ? 'Deck Mode Active' : 'Normal Standby'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {deckState.settings.activation_hotkey.ctrl ? 'Ctrl+' : ''}
                {deckState.settings.activation_hotkey.alt ? 'Alt+' : ''}
                {deckState.settings.activation_hotkey.shift ? 'Shift+' : ''}
                {deckState.settings.activation_hotkey.key}
              </div>
            </div>
          </div>
          <Power size={16} color={isDeckActive ? '#10B981' : '#64748B'} />
        </button>
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => setCurrentTab('deck')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: currentTab === 'deck' ? 600 : 500,
            color: currentTab === 'deck' ? '#FFFFFF' : '#94A3B8',
            backgroundColor: currentTab === 'deck' ? '#1F2636' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
          }}
        >
          <LayoutGrid size={16} color={currentTab === 'deck' ? '#3B82F6' : '#64748B'} />
          <span>Deck Workspace</span>
        </button>

        <button
          onClick={() => setCurrentTab('profiles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: currentTab === 'profiles' ? 600 : 500,
            color: currentTab === 'profiles' ? '#FFFFFF' : '#94A3B8',
            backgroundColor: currentTab === 'profiles' ? '#1F2636' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
          }}
        >
          <Layers size={16} color={currentTab === 'profiles' ? '#8B5CF6' : '#64748B'} />
          <span>Profiles</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              backgroundColor: '#161A24',
              color: '#94A3B8',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {deckState.profiles.length}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('actions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: currentTab === 'actions' ? 600 : 500,
            color: currentTab === 'actions' ? '#FFFFFF' : '#94A3B8',
            backgroundColor: currentTab === 'actions' ? '#1F2636' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
          }}
        >
          <Zap size={16} color={currentTab === 'actions' ? '#F59E0B' : '#64748B'} />
          <span>Action Library</span>
        </button>

        <button
          onClick={() => setCurrentTab('tester')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: currentTab === 'tester' ? 600 : 500,
            color: currentTab === 'tester' ? '#FFFFFF' : '#94A3B8',
            backgroundColor: currentTab === 'tester' ? '#1F2636' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
          }}
        >
          <Activity size={16} color={currentTab === 'tester' ? '#10B981' : '#64748B'} />
          <span>Diagnostics & Test</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: currentTab === 'settings' ? 600 : 500,
            color: currentTab === 'settings' ? '#FFFFFF' : '#94A3B8',
            backgroundColor: currentTab === 'settings' ? '#1F2636' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
          }}
        >
          <SettingsIcon size={16} color={currentTab === 'settings' ? '#38BDF8' : '#64748B'} />
          <span>Settings</span>
        </button>
      </div>

      {/* Profiles Quick Switcher Section */}
      <div style={{ marginTop: 'auto', padding: '14px', borderTop: '1px solid #1A1F2B' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Active Profile
          </span>
          <span style={{ fontSize: '11px', color: '#3B82F6', cursor: 'pointer' }} onClick={() => setCurrentTab('profiles')}>
            Manage
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {deckState.profiles.map((p) => {
            const isSelected = p.id === deckState.active_profile_id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #2B354D' : '1px solid transparent',
                  background: isSelected ? '#1A2130' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s ease',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: p.color || '#3B82F6',
                  }}
                />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </span>
                {isSelected && (
                  <span style={{ fontSize: '9px', backgroundColor: '#2563EB', color: '#FFFFFF', padding: '1px 5px', borderRadius: '3px' }}>
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
