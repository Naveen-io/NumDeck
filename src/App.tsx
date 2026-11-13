import React, { useState, useEffect, useRef } from 'react';
import { AppData, EngineMode, KeyAssignment, ActionConfig, CalibrationProfile, Profile, domEventToNumpadKeyId, NavTab } from './types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Components
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NumpadDeck } from './components/NumpadDeck';
import { KeyInspector } from './components/KeyInspector';
import { HomeView } from './components/HomeView';
import { SettingsView } from './components/SettingsView';
import { CalibrationWizard } from './components/CalibrationWizard';
import { ActionModal } from './components/ActionModal';
import { ProfilesModal } from './components/ProfilesModal';
import { OnboardingModal } from './components/OnboardingModal';

const MOCK_DATA: AppData = {
  version: 1,
  settings: {
    deck_mode: false,
    active_profile_id: 'general',
    emergency_shortcut_enabled: true,
    sound_feedback: true,
    run_at_startup: false,
    minimize_to_tray: false,
  },
  calibration: {
    signatures: {
      numpad_7: [{ vk_code: 103, scan_code: 71, is_extended: false }],
      numpad_8: [{ vk_code: 104, scan_code: 72, is_extended: false }],
      numpad_9: [{ vk_code: 105, scan_code: 73, is_extended: false }],
      numpad_enter: [{ vk_code: 13, scan_code: 28, is_extended: true }],
    },
    is_completed: true,
  },
  profiles: [
    {
      id: 'general',
      name: 'General',
      icon: 'LayoutGrid',
      keys: {
        numpad_numlock: { key_id: 'numpad_numlock', label: 'Deck Toggle', icon: 'Power', color: '#397BFF', action: { type: 'ToggleDeckMode' } },
        numpad_divide: { key_id: 'numpad_divide', label: 'Mute Audio', icon: 'VolumeX', color: '#EF4444', action: { type: 'SystemMedia', payload: { command: 'mute' } } },
        numpad_multiply: { key_id: 'numpad_multiply', label: 'Play / Pause', icon: 'PlayPause', color: '#10B981', action: { type: 'SystemMedia', payload: { command: 'play_pause' } } },
        numpad_subtract: { key_id: 'numpad_subtract', label: 'Volume Down', icon: 'Volume1', color: '#94A3B8', action: { type: 'SystemMedia', payload: { command: 'volume_down' } } },
        numpad_add: { key_id: 'numpad_add', label: 'Volume Up', icon: 'Volume2', color: '#3B82F6', action: { type: 'SystemMedia', payload: { command: 'volume_up' } } },
        numpad_7: { key_id: 'numpad_7', label: 'Chrome', icon: 'chrome', color: '#4285F4', action: { type: 'OpenPath', payload: { path: 'https://www.google.com' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Calculator', icon: 'Calculator', color: '#E9B86A', action: { type: 'LaunchApp', payload: { path: 'calc.exe' } } },
        numpad_9: { key_id: 'numpad_9', label: 'Notepad', icon: 'notepad', color: '#0078D7', action: { type: 'LaunchApp', payload: { path: 'notepad.exe' } } },
        numpad_4: { key_id: 'numpad_4', label: 'Prev Track', icon: 'SkipBack', color: '#94A3B8', action: { type: 'SystemMedia', payload: { command: 'prev_track' } } },
        numpad_5: { key_id: 'numpad_5', label: 'Explorer', icon: 'explorer', color: '#FFA000', action: { type: 'LaunchApp', payload: { path: 'explorer.exe' } } },
        numpad_6: { key_id: 'numpad_6', label: 'Next Track', icon: 'SkipForward', color: '#94A3B8', action: { type: 'SystemMedia', payload: { command: 'next_track' } } },
        numpad_1: { key_id: 'numpad_1', label: 'Screenshot', icon: 'Camera', color: '#3B82F6', action: { type: 'Hotkey', payload: { modifiers: ['win', 'shift'], key: 'S' } } },
        numpad_2: { key_id: 'numpad_2', label: 'Task Manager', icon: 'Activity', color: '#EF4444', action: { type: 'Hotkey', payload: { modifiers: ['ctrl', 'shift'], key: 'ESCAPE' } } },
        numpad_3: { key_id: 'numpad_3', label: 'Lock PC', icon: 'Lock', color: '#64748B', action: { type: 'Hotkey', payload: { modifiers: ['win'], key: 'L' } } },
        numpad_0: { key_id: 'numpad_0', label: 'Paste Template', icon: 'Clipboard', color: '#10B981', action: { type: 'TypeText', payload: { text: 'Support Template' } } },
        numpad_decimal: { key_id: 'numpad_decimal', label: 'Settings', icon: 'Settings', color: '#94A3B8', action: { type: 'Hotkey', payload: { modifiers: ['win'], key: 'I' } } },
        numpad_enter: { key_id: 'numpad_enter', label: 'Terminal', icon: 'terminal', color: '#4EC9B0', action: { type: 'LaunchApp', payload: { path: 'wt.exe' } } },
      },
      folders: [],
    },
    {
      id: 'gaming',
      name: 'Gaming',
      icon: 'Gamepad2',
      keys: {
        numpad_7: { key_id: 'numpad_7', label: 'Discord', icon: 'discord', color: '#5865F2', action: { type: 'OpenPath', payload: { path: 'discord://' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Steam', icon: 'steam', color: '#1999D4', action: { type: 'OpenPath', payload: { path: 'steam://open/main' } } },
        numpad_9: { key_id: 'numpad_9', label: 'OBS Studio', icon: 'obs', color: '#94A3B8', action: { type: 'LaunchApp', payload: { path: 'obs64.exe' } } },
        numpad_4: { key_id: 'numpad_4', label: 'Spotify', icon: 'spotify', color: '#1DB954', action: { type: 'OpenPath', payload: { path: 'spotify:' } } },
      },
      folders: [],
    },
    {
      id: 'coding',
      name: 'Coding',
      icon: 'Code',
      keys: {
        numpad_7: { key_id: 'numpad_7', label: 'VS Code', icon: 'vscode', color: '#007ACC', action: { type: 'LaunchApp', payload: { path: 'code' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Terminal', icon: 'terminal', color: '#4EC9B0', action: { type: 'LaunchApp', payload: { path: 'wt.exe' } } },
        numpad_9: { key_id: 'numpad_9', label: 'Visual Studio', icon: 'visualstudio', color: '#865FC5', action: { type: 'LaunchApp', payload: { path: 'devenv.exe' } } },
        numpad_5: { key_id: 'numpad_5', label: 'Firefox Dev', icon: 'firefox', color: '#FF7139', action: { type: 'OpenPath', payload: { path: 'https://localhost:3000' } } },
      },
      folders: [],
    },
    {
      id: 'editing',
      name: 'Editing',
      icon: 'Film',
      keys: {
        numpad_7: { key_id: 'numpad_7', label: 'Photoshop', icon: 'photoshop', color: '#31A8FF', action: { type: 'LaunchApp', payload: { path: 'Photoshop.exe' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Premiere', icon: 'premiere', color: '#EA77FF', action: { type: 'LaunchApp', payload: { path: 'Adobe Premiere Pro.exe' } } },
        numpad_9: { key_id: 'numpad_9', label: 'Blender', icon: 'blender', color: '#EA7600', action: { type: 'LaunchApp', payload: { path: 'blender.exe' } } },
        numpad_5: { key_id: 'numpad_5', label: 'VLC Player', icon: 'vlc', color: '#FF7800', action: { type: 'LaunchApp', payload: { path: 'vlc.exe' } } },
      },
      folders: [],
    },
    {
      id: 'streaming',
      name: 'Streaming',
      icon: 'Tv',
      keys: {
        numpad_7: { key_id: 'numpad_7', label: 'OBS Studio', icon: 'obs', color: '#94A3B8', action: { type: 'LaunchApp', payload: { path: 'obs64.exe' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Discord', icon: 'discord', color: '#5865F2', action: { type: 'OpenPath', payload: { path: 'discord://' } } },
        numpad_9: { key_id: 'numpad_9', label: 'Spotify', icon: 'spotify', color: '#1DB954', action: { type: 'OpenPath', payload: { path: 'spotify:' } } },
      },
      folders: [],
    },
  ],
};

export const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isDeckMode, setIsDeckMode] = useState(false);
  const [numLockOn, setNumLockOn] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('deck');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>('numpad_7');
  const [activeTriggeredKeyId, setActiveTriggeredKeyId] = useState<string | null>(null);

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // 1. Initial Load from Tauri Backend
  useEffect(() => {
    const init = async () => {
      try {
        const data = await invoke<AppData>('get_initial_data');
        setAppData(data);
        setIsDeckMode(data.settings.deck_mode);

        const nlState = await invoke<boolean>('get_numlock_state');
        setNumLockOn(nlState);

        // Show onboarding only if never seen / completed
        if (!data.calibration?.is_completed) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.warn('Tauri IPC not detected (Browser Preview mode): using fallback state', err);
        setAppData(MOCK_DATA);
        setIsDeckMode(false);
        setNumLockOn(true);
      }
    };

    init();
  }, []);

  // 2. Setup Tauri Backend Event Listeners
  useEffect(() => {
    let unlistenMode: (() => void) | undefined;
    let unlistenTriggered: (() => void) | undefined;
    let unlistenProfile: (() => void) | undefined;
    let unlistenFolder: (() => void) | undefined;
    let unlistenEmergency: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenMode = await listen<boolean>('deck-mode-changed', (e) => {
        setIsDeckMode(e.payload);
      });

      unlistenTriggered = await listen<string>('deck-key-triggered', (e) => {
        const keyId = e.payload;
        setActiveTriggeredKeyId(keyId);
        setTimeout(() => setActiveTriggeredKeyId(null), 250);

        // Sound feedback
        if (appData?.settings.sound_feedback) {
          playAudioClick();
        }
      });

      unlistenProfile = await listen<string>('profile-switched', (e) => {
        if (appData) {
          setAppData({
            ...appData,
            settings: { ...appData.settings, active_profile_id: e.payload },
          });
        }
      });

      unlistenFolder = await listen<string | undefined>('folder-changed', (e) => {
        if (appData) {
          setAppData({
            ...appData,
            settings: { ...appData.settings, active_folder_id: e.payload },
          });
        }
      });

      unlistenEmergency = await listen('emergency-reset', () => {
        setIsDeckMode(false);
        setBannerNotice('Emergency Disarm: Deck Mode deactivated.');
        setTimeout(() => setBannerNotice(null), 5000);
      });
    };

    setupListeners();

    // Periodic NumLock check (every 1 second)
    const interval = setInterval(async () => {
      try {
        const nl = await invoke<boolean>('get_numlock_state');
        setNumLockOn(nl);
      } catch (_) {}
    }, 1000);

    return () => {
      if (unlistenMode) unlistenMode();
      if (unlistenTriggered) unlistenTriggered();
      if (unlistenProfile) unlistenProfile();
      if (unlistenFolder) unlistenFolder();
      if (unlistenEmergency) unlistenEmergency();
      clearInterval(interval);
    };
  }, [appData]);

  // Synchronized ref for capture-phase listener
  const isDeckModeRef = useRef(isDeckMode);
  useEffect(() => {
    isDeckModeRef.current = isDeckMode;
  }, [isDeckMode]);

  // Global capture-phase keyboard interceptor
  // Guarantees zero button focus movement and instant action execution when NUMPAD DECK is focused
  useEffect(() => {
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (isDeckModeRef.current) {
        const keyId = domEventToNumpadKeyId(e);
        if (keyId) {
          // Strictly prevent browser spatial navigation / button focus jumping
          e.preventDefault();
          e.stopPropagation();

          // Defocus active element so focus never sticks
          if (document.activeElement && (document.activeElement as HTMLElement).blur) {
            (document.activeElement as HTMLElement).blur();
          }

          // Trigger action via backend
          invoke('trigger_deck_key', { keyId }).catch(console.error);
        }
      }
    };

    const handleKeyUpCapture = (e: KeyboardEvent) => {
      if (isDeckModeRef.current) {
        const keyId = domEventToNumpadKeyId(e);
        if (keyId) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDownCapture, { capture: true });
    window.addEventListener('keyup', handleKeyUpCapture, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, { capture: true });
      window.removeEventListener('keyup', handleKeyUpCapture, { capture: true });
    };
  }, []);

  // Audio click synthesizer using Web Audio API
  const playAudioClick = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  };

  // Deck Mode toggle
  const handleToggleDeckMode = async () => {
    const nextMode: EngineMode = isDeckMode ? 'Normal' : 'Deck';
    try {
      await invoke('set_engine_mode', { mode: nextMode });
      setIsDeckMode(!isDeckMode);
      if (appData) {
        const updated = {
          ...appData,
          settings: { ...appData.settings, deck_mode: !isDeckMode },
        };
        setAppData(updated);
        await invoke('save_settings', { settings: updated.settings });
      }
    } catch (err) {
      console.error('Failed to toggle deck mode:', err);
    }
  };

  // Select profile
  const handleSelectProfile = async (profileId: string) => {
    try {
      await invoke('set_active_profile', { profileId });
      if (appData) {
        setAppData({
          ...appData,
          settings: { ...appData.settings, active_profile_id: profileId, active_folder_id: undefined },
        });
      }
    } catch (err) {
      console.error('Failed to switch profile:', err);
    }
  };

  // Save updated profiles
  const handleSaveProfiles = async (newProfiles: Profile[]) => {
    if (!appData) return;
    try {
      await invoke('save_profiles', { profiles: newProfiles });
      setAppData({ ...appData, profiles: newProfiles });
    } catch (err) {
      console.error('Failed to save profiles:', err);
    }
  };

  // Save key assignment
  const handleSaveKeyAssignment = async (assignment: KeyAssignment) => {
    if (!appData) return;
    const activeProf = appData.profiles.find((p) => p.id === appData.settings.active_profile_id);
    if (!activeProf) return;

    const updatedKeys = { ...activeProf.keys, [assignment.key_id]: assignment };
    const updatedProfiles = appData.profiles.map((p) =>
      p.id === activeProf.id ? { ...p, keys: updatedKeys } : p
    );

    await handleSaveProfiles(updatedProfiles);
    setIsActionModalOpen(false);
  };

  // Remove key assignment
  const handleRemoveKeyAssignment = async () => {
    if (!appData || !selectedKeyId) return;
    const activeProf = appData.profiles.find((p) => p.id === appData.settings.active_profile_id);
    if (!activeProf) return;

    const updatedKeys = { ...activeProf.keys };
    delete updatedKeys[selectedKeyId];

    const updatedProfiles = appData.profiles.map((p) =>
      p.id === activeProf.id ? { ...p, keys: updatedKeys } : p
    );

    await handleSaveProfiles(updatedProfiles);
  };

  // Test action immediately
  const handleTestAction = async (action: ActionConfig) => {
    try {
      await invoke('test_action', { action });
      setBannerNotice(`Action triggered: ${action.type}`);
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error('Action execution failed:', err);
      setBannerNotice(`Action failed: ${err}`);
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  // Save calibration
  const handleSaveCalibration = async (newCal: CalibrationProfile) => {
    if (!appData) return;
    try {
      await invoke('save_calibration', { calibration: newCal });
      setAppData({ ...appData, calibration: newCal });
      setIsCalibrationOpen(false);
      setBannerNotice('Keypad calibration updated successfully.');
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error('Failed to save calibration:', err);
    }
  };

  // Reset calibration
  const handleResetCalibration = async () => {
    try {
      const def = await invoke<CalibrationProfile>('reset_calibration_to_default');
      if (appData) {
        setAppData({ ...appData, calibration: def });
      }
      setIsCalibrationOpen(false);
      setBannerNotice('Keypad calibration restored to defaults.');
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error('Failed to reset calibration:', err);
    }
  };

  if (!appData) {
    return (
      <div className="h-screen w-screen bg-[#08090C] flex flex-col items-center justify-center text-[#F4F6FA] select-none">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full mb-3" />
        <span className="text-xs font-semibold text-[#94A3B8]">Loading NumDeck...</span>
      </div>
    );
  }

  const currentProfile =
    appData.profiles.find((p) => p.id === appData.settings.active_profile_id) || appData.profiles[0];
  const currentAssignments = currentProfile?.keys || {};
  const selectedAssignment = selectedKeyId ? currentAssignments[selectedKeyId] : undefined;

  return (
    <div className="flex h-screen w-screen bg-[#08090C] text-[#F1F5F9] overflow-hidden select-none">
      {/* 3-Tab Stream Deck Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isDeckMode={isDeckMode}
        onToggleDeckMode={handleToggleDeckMode}
        activeProfileName={currentProfile?.name || 'General'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'home' && (
          <HomeView
            isDeckMode={isDeckMode}
            onToggleDeckMode={handleToggleDeckMode}
            numLockOn={numLockOn}
            activeProfile={currentProfile}
            profiles={appData.profiles}
            onSelectProfile={handleSelectProfile}
            onNavigateToDeck={() => setCurrentTab('deck')}
            onNavigateToSettings={() => setCurrentTab('settings')}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
          />
        )}

        {currentTab === 'deck' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar for Deck Workspace */}
            <TopBar
              profiles={appData.profiles}
              activeProfileId={appData.settings.active_profile_id}
              onSelectProfile={handleSelectProfile}
              onManageProfiles={() => setIsProfilesModalOpen(true)}
              activeFolderId={appData.settings.active_folder_id}
              onNavigateBack={() => {
                setAppData({
                  ...appData,
                  settings: { ...appData.settings, active_folder_id: undefined },
                });
              }}
              isDeckMode={isDeckMode}
              onToggleDeckMode={handleToggleDeckMode}
              numLockOn={numLockOn}
              isCalibrated={!!appData.calibration?.is_completed}
              onOpenCalibration={() => setIsCalibrationOpen(true)}
            />

            {/* Notification Banner */}
            {bannerNotice && (
              <div className="bg-[#1D4ED8]/20 border-b border-[#3B82F6]/40 text-[#F1F5F9] px-6 py-2 text-xs font-semibold flex items-center justify-between shrink-0">
                <span>{bannerNotice}</span>
                <button
                  onClick={() => setBannerNotice(null)}
                  className="text-[#94A3B8] hover:text-white text-xs ml-4 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Deck Surface & Property Inspector */}
            <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden">
              <NumpadDeck
                assignments={currentAssignments}
                selectedKeyId={selectedKeyId}
                onSelectKey={(kId) => setSelectedKeyId(kId)}
                activeTriggeredKeyId={activeTriggeredKeyId}
                isDeckMode={isDeckMode}
                profileName={currentProfile?.name || 'General'}
              />

              <KeyInspector
                selectedKeyId={selectedKeyId}
                assignment={selectedAssignment}
                onEditAction={() => setIsActionModalOpen(true)}
                onRemoveAction={handleRemoveKeyAssignment}
                onTestAction={handleTestAction}
                onQuickAssign={handleSaveKeyAssignment}
              />
            </div>
          </div>
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={appData.settings}
            onUpdateSettings={async (updated) => {
              setAppData({ ...appData, settings: updated });
              await invoke('save_settings', { settings: updated });
            }}
            calibration={appData.calibration}
            numLockOn={numLockOn}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onResetCalibration={handleResetCalibration}
          />
        )}
      </div>

      {/* Action Configuration Modal */}
      {isActionModalOpen && selectedKeyId && (
        <ActionModal
          keyId={selectedKeyId}
          initialAssignment={selectedAssignment}
          profiles={appData.profiles}
          onSave={handleSaveKeyAssignment}
          onCancel={() => setIsActionModalOpen(false)}
          onTest={handleTestAction}
        />
      )}

      {/* Profiles Management Modal */}
      {isProfilesModalOpen && (
        <ProfilesModal
          profiles={appData.profiles}
          activeProfileId={appData.settings.active_profile_id}
          onSelectProfile={(pId) => {
            handleSelectProfile(pId);
            setIsProfilesModalOpen(false);
          }}
          onSaveProfiles={handleSaveProfiles}
          onClose={() => setIsProfilesModalOpen(false)}
        />
      )}

      {/* Calibration Wizard Modal */}
      {isCalibrationOpen && (
        <CalibrationWizard
          initialCalibration={appData.calibration}
          numLockOn={numLockOn}
          isDeckMode={isDeckMode}
          onSave={handleSaveCalibration}
          onCancel={() => setIsCalibrationOpen(false)}
          onResetDefaults={handleResetCalibration}
        />
      )}

      {/* Onboarding Flow */}
      {isOnboardingOpen && (
        <OnboardingModal
          onStartCalibration={() => {
            setIsOnboardingOpen(false);
            setIsCalibrationOpen(true);
          }}
          onDismiss={() => setIsOnboardingOpen(false)}
        />
      )}
    </div>
  );
};
