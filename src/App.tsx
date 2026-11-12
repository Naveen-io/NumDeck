import React, { useState, useEffect } from 'react';
import { AppData, EngineMode, KeyAssignment, ActionConfig, CalibrationProfile, Profile } from './types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Components
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NumpadDeck } from './components/NumpadDeck';
import { KeyInspector } from './components/KeyInspector';
import { CalibrationWizard } from './components/CalibrationWizard';
import { DiagnosticViewer } from './components/DiagnosticViewer';
import { ActionModal } from './components/ActionModal';
import { ProfilesModal } from './components/ProfilesModal';
import { SettingsModal } from './components/SettingsModal';
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
        numpad_divide: { key_id: 'numpad_divide', label: 'Mute Audio', icon: 'VolumeX', color: '#ED7777', action: { type: 'SystemMedia', payload: { command: 'mute' } } },
        numpad_multiply: { key_id: 'numpad_multiply', label: 'Play / Pause', icon: 'PlayPause', color: '#65C991', action: { type: 'SystemMedia', payload: { command: 'play_pause' } } },
        numpad_subtract: { key_id: 'numpad_subtract', label: 'Volume Down', icon: 'Volume1', color: '#929CAC', action: { type: 'SystemMedia', payload: { command: 'volume_down' } } },
        numpad_add: { key_id: 'numpad_add', label: 'Volume Up', icon: 'Volume2', color: '#397BFF', action: { type: 'SystemMedia', payload: { command: 'volume_up' } } },
        numpad_7: { key_id: 'numpad_7', label: 'Browser', icon: 'Globe', color: '#397BFF', action: { type: 'OpenPath', payload: { path: 'https://www.google.com' } } },
        numpad_8: { key_id: 'numpad_8', label: 'Calculator', icon: 'Calculator', color: '#E9B86A', action: { type: 'LaunchApp', payload: { path: 'calc.exe' } } },
        numpad_9: { key_id: 'numpad_9', label: 'Notepad', icon: 'FileText', color: '#65C991', action: { type: 'LaunchApp', payload: { path: 'notepad.exe' } } },
        numpad_4: { key_id: 'numpad_4', label: 'Prev Track', icon: 'SkipBack', color: '#929CAC', action: { type: 'SystemMedia', payload: { command: 'prev_track' } } },
        numpad_5: { key_id: 'numpad_5', label: 'Explorer', icon: 'Folder', color: '#E9B86A', action: { type: 'LaunchApp', payload: { path: 'explorer.exe' } } },
        numpad_6: { key_id: 'numpad_6', label: 'Next Track', icon: 'SkipForward', color: '#929CAC', action: { type: 'SystemMedia', payload: { command: 'next_track' } } },
        numpad_1: { key_id: 'numpad_1', label: 'Screenshot', icon: 'Camera', color: '#397BFF', action: { type: 'Hotkey', payload: { modifiers: ['win', 'shift'], key: 'S' } } },
        numpad_2: { key_id: 'numpad_2', label: 'Task Manager', icon: 'Activity', color: '#ED7777', action: { type: 'Hotkey', payload: { modifiers: ['ctrl', 'shift'], key: 'ESCAPE' } } },
        numpad_3: { key_id: 'numpad_3', label: 'Lock Screen', icon: 'Lock', color: '#929CAC', action: { type: 'Hotkey', payload: { modifiers: ['win'], key: 'L' } } },
        numpad_0: { key_id: 'numpad_0', label: 'Paste Template', icon: 'Clipboard', color: '#65C991', action: { type: 'TypeText', payload: { text: 'Support Template' } } },
        numpad_decimal: { key_id: 'numpad_decimal', label: 'Settings', icon: 'Settings', color: '#929CAC', action: { type: 'Hotkey', payload: { modifiers: ['win'], key: 'I' } } },
        numpad_enter: { key_id: 'numpad_enter', label: 'Multi Macro', icon: 'Layers', color: '#397BFF', action: { type: 'MultiAction', payload: { steps: [] } } },
      },
      folders: [],
    },
    { id: 'gaming', name: 'Gaming', icon: 'Gamepad2', keys: {}, folders: [] },
    { id: 'coding', name: 'Coding', icon: 'Code', keys: {}, folders: [] },
    { id: 'editing', name: 'Editing', icon: 'Film', keys: {}, folders: [] },
    { id: 'streaming', name: 'Streaming', icon: 'Tv', keys: {}, folders: [] },
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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

        // Show onboarding if not yet calibrated
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
        setBannerNotice('EMERGENCY DISARM TRIGGERED: Deck Mode has been deactivated.');
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
      setBannerNotice(`Test action executed successfully: ${action.type}`);
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
      setBannerNotice('Calibration saved and verified!');
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
      setBannerNotice('Calibration reset to standard hardware defaults.');
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error('Failed to reset calibration:', err);
    }
  };

  if (!appData) {
    return (
      <div className="h-screen w-screen bg-[#08090C] flex flex-col items-center justify-center text-[#F4F6FA] select-none">
        <div className="w-10 h-10 border-2 border-[#397BFF] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide text-[#929CAC]">Initializing Numpad Deck Engine...</span>
      </div>
    );
  }

  const currentProfile =
    appData.profiles.find((p) => p.id === appData.settings.active_profile_id) || appData.profiles[0];
  const currentAssignments = currentProfile?.keys || {};
  const selectedAssignment = selectedKeyId ? currentAssignments[selectedKeyId] : undefined;

  return (
    <div className="flex h-screen w-screen bg-[#08090C] text-[#F4F6FA] overflow-hidden select-none">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'profiles') setIsProfilesModalOpen(true);
          else if (tab === 'calibration') setIsCalibrationOpen(true);
          else if (tab === 'settings') setIsSettingsModalOpen(true);
          else setCurrentTab(tab);
        }}
        isDeckMode={isDeckMode}
        onToggleDeckMode={handleToggleDeckMode}
        isCalibrated={!!appData.calibration?.is_completed}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <TopBar
          profiles={appData.profiles}
          activeProfileId={appData.settings.active_profile_id}
          onSelectProfile={handleSelectProfile}
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

        {/* Floating Banner Notification */}
        {bannerNotice && (
          <div className="bg-[#397BFF]/20 border-b border-[#397BFF]/40 text-[#F4F6FA] px-6 py-2 text-xs font-semibold flex items-center justify-between shrink-0">
            <span>{bannerNotice}</span>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-[#929CAC] hover:text-white text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content depending on currentTab */}
        {currentTab === 'deck' ? (
          <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Center: 17-Key Numpad Deck Surface */}
            <NumpadDeck
              assignments={currentAssignments}
              selectedKeyId={selectedKeyId}
              onSelectKey={(kId) => setSelectedKeyId(kId)}
              activeTriggeredKeyId={activeTriggeredKeyId}
              isDeckMode={isDeckMode}
            />

            {/* Right: Key Inspector */}
            <KeyInspector
              selectedKeyId={selectedKeyId}
              assignment={selectedAssignment}
              calibration={appData.calibration}
              onEditAction={() => setIsActionModalOpen(true)}
              onRemoveAction={handleRemoveKeyAssignment}
              onTestAction={handleTestAction}
              onQuickAssign={handleSaveKeyAssignment}
            />
          </div>
        ) : (
          <DiagnosticViewer numLockOn={numLockOn} isDeckMode={isDeckMode} />
        )}
      </div>

      {/* Modals */}
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

      {isSettingsModalOpen && (
        <SettingsModal
          settings={appData.settings}
          onUpdateSettings={async (updated) => {
            setAppData({ ...appData, settings: updated });
            await invoke('save_settings', { settings: updated });
          }}
          onResetCalibration={handleResetCalibration}
          onClose={() => setIsSettingsModalOpen(false)}
          isCalibrated={!!appData.calibration?.is_completed}
        />
      )}

      {isCalibrationOpen && (
        <CalibrationWizard
          initialCalibration={appData.calibration}
          numLockOn={numLockOn}
          onSave={handleSaveCalibration}
          onCancel={() => setIsCalibrationOpen(false)}
          onResetDefaults={handleResetCalibration}
        />
      )}

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
