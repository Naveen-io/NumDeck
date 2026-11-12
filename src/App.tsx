import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  DeckState,
  NumpadKey,
  ButtonConfig,
  ActionConfig,
  Profile,
  DeckFolder,
  HardwareDetectionReport,
  HotkeyConfig,
  RawKeyEvent,
} from './types';
import { Sidebar } from './components/Sidebar';
import { NumpadGrid } from './components/NumpadGrid';
import { ButtonEditor } from './components/ButtonEditor';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfilesModal } from './components/ProfilesModal';
import { ActionLibrary } from './components/ActionLibrary';
import { KeyboardTester } from './components/KeyboardTester';
import { SettingsModal } from './components/SettingsModal';
import { playKeyClickSound, playSuccessChirp } from './utils/sound';

export const App: React.FC = () => {
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [currentTab, setCurrentTab] = useState<'deck' | 'profiles' | 'actions' | 'tester' | 'settings'>('deck');
  const [selectedKey, setSelectedKey] = useState<NumpadKey>('num7');
  const [physicallyPressedKey, setPhysicallyPressedKey] = useState<NumpadKey | null>(null);
  const [detectionReport, setDetectionReport] = useState<HardwareDetectionReport | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [recentTestEvents, setRecentTestEvents] = useState<any[]>([]);
  const [lastTestedKey, setLastTestedKey] = useState<NumpadKey | null>(null);
  const [lastRawKey, setLastRawKey] = useState<RawKeyEvent | null>(null);

  const stateRef = useRef(deckState);
  stateRef.current = deckState;

  // 1. Initial State Load & Hardware Detection
  useEffect(() => {
    async function initApp() {
      try {
        const state: DeckState = await invoke('get_state');
        setDeckState(state);

        if (!state.settings.onboarding_completed) {
          setShowOnboarding(true);
        }

        const report: HardwareDetectionReport = await invoke('detect_hardware');
        setDetectionReport(report);
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      }
    }

    initApp();

    // Enable test mode so test events stream smoothly
    invoke('set_test_mode', { enabled: true });
  }, []);

  // 2. Setup Tauri Event Listeners
  useEffect(() => {
    const unlistenPromises = [
      listen<boolean>('deck-mode-changed', (event) => {
        setDeckState((prev) => (prev ? { ...prev, is_deck_active: event.payload } : null));
      }),

      listen<{ key: NumpadKey }>('deck-key-pressed', (event) => {
        const key = event.payload.key;
        setPhysicallyPressedKey(key);
        if (stateRef.current?.settings.sound_feedback) {
          playKeyClickSound();
        }
        setTimeout(() => {
          setPhysicallyPressedKey((curr) => (curr === key ? null : curr));
        }, 220);
      }),

      listen<{ key: NumpadKey; down: boolean; vk: number; scan: number }>('deck-key-test', (event) => {
        const { key, down, vk, scan } = event.payload;
        if (down) {
          setLastTestedKey(key);
          if (stateRef.current?.settings.sound_feedback) {
            playKeyClickSound();
          }
          const now = new Date().toLocaleTimeString();
          setRecentTestEvents((prev) => [
            {
              id: `${Date.now()}_${Math.random()}`,
              key,
              down,
              vk,
              scan,
              timestamp: now,
            },
            ...prev.slice(0, 49),
          ]);
        }
      }),

      listen<RawKeyEvent>('deck-raw-key', (event) => {
        setLastRawKey(event.payload);
      }),

      listen<string | null>('active-folder-changed', (event) => {
        setDeckState((prev) => (prev ? { ...prev, active_folder_id: event.payload } : null));
      }),

      listen<string>('active-profile-changed', (event) => {
        setDeckState((prev) =>
          prev
            ? { ...prev, active_profile_id: event.payload, active_folder_id: null }
            : null
        );
      }),

      listen<string>('navigate', (event) => {
        if (event.payload === 'settings') {
          setCurrentTab('settings');
        }
      }),
    ];

    return () => {
      unlistenPromises.forEach((p) => p.then((unlisten) => unlisten()));
    };
  }, []);

  if (!deckState) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0A0C10',
          color: '#94A3B8',
          fontSize: '14px',
        }}
      >
        Initializing Numpad Deck Engine...
      </div>
    );
  }

  // Active Profile & Folder Resolution
  const activeProfile =
    deckState.profiles.find((p) => p.id === deckState.active_profile_id) || deckState.profiles[0];

  const currentFolder = activeProfile.folders.find((f) => f.id === deckState.active_folder_id);

  const currentKeyConfig: ButtonConfig =
    (currentFolder ? currentFolder.keys[selectedKey] : activeProfile.root_keys[selectedKey]) || {
      title: '',
      icon: '',
      accent_color: null,
      custom_icon_path: null,
      action: { type: 'none' },
      enabled: true,
    };

  // State Persistence Helper
  const persistState = async (updated: DeckState) => {
    setDeckState(updated);
    try {
      await invoke('save_state', { newState: updated });
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  };

  // Handlers
  const handleToggleDeckMode = async () => {
    try {
      const newMode: boolean = await invoke('toggle_deck_mode');
      setDeckState((prev) => (prev ? { ...prev, is_deck_active: newMode } : null));
      playKeyClickSound();
    } catch (err) {
      console.error('Failed to toggle deck mode:', err);
    }
  };

  const handleToggleNumlock = async () => {
    try {
      const isNumlockOn: boolean = await invoke('toggle_numlock');
      setDetectionReport((prev) => (prev ? { ...prev, numlock_on: isNumlockOn } : null));
      playKeyClickSound();
    } catch (err) {
      console.error('Failed to toggle numlock:', err);
    }
  };

  const handleToggleCompactMode = (enabled: boolean) => {
    if (!deckState) return;
    const updated: DeckState = {
      ...deckState,
      settings: {
        ...deckState.settings,
        compact_laptop_mode: enabled,
      },
    };
    persistState(updated);
  };

  const handleSelectProfile = (profileId: string) => {
    const updated: DeckState = {
      ...deckState,
      active_profile_id: profileId,
      active_folder_id: null,
    };
    persistState(updated);
  };

  const handleNavigateFolder = (folderId: string | null) => {
    const updated: DeckState = {
      ...deckState,
      active_folder_id: folderId,
    };
    persistState(updated);
  };

  const handleUpdateButtonConfig = (newConfig: ButtonConfig) => {
    const updatedProfiles = deckState.profiles.map((profile) => {
      if (profile.id !== deckState.active_profile_id) return profile;

      if (deckState.active_folder_id) {
        const updatedFolders = profile.folders.map((folder) => {
          if (folder.id !== deckState.active_folder_id) return folder;
          return {
            ...folder,
            keys: {
              ...folder.keys,
              [selectedKey]: newConfig,
            },
          };
        });
        return { ...profile, folders: updatedFolders };
      } else {
        return {
          ...profile,
          root_keys: {
            ...profile.root_keys,
            [selectedKey]: newConfig,
          },
        };
      }
    });

    persistState({
      ...deckState,
      profiles: updatedProfiles,
    });
  };

  const handleTestExecute = async (action: ActionConfig) => {
    try {
      await invoke('execute_button_action', { action });
      playKeyClickSound();
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  const handleCreateFolder = (name: string): string => {
    const newFolderId = `folder_${Date.now()}`;
    const newFolder: DeckFolder = {
      id: newFolderId,
      name,
      keys: {
        num_lock: {
          title: 'Back',
          icon: 'CornerUpLeft',
          accent_color: '#EF4444',
          custom_icon_path: null,
          action: { type: 'navigate_folder', payload: { folder_id: '__BACK__' } },
          enabled: true,
        },
      } as any,
    };

    const updatedProfiles = deckState.profiles.map((p) => {
      if (p.id !== deckState.active_profile_id) return p;
      return {
        ...p,
        folders: [...p.folders, newFolder],
      };
    });

    persistState({
      ...deckState,
      profiles: updatedProfiles,
    });

    return newFolderId;
  };

  const handleCreateProfile = (name: string, color: string, icon: string) => {
    const newId = `profile_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name,
      icon,
      color,
      root_keys: {} as any,
      folders: [],
    };

    persistState({
      ...deckState,
      active_profile_id: newId,
      active_folder_id: null,
      profiles: [...deckState.profiles, newProfile],
    });
    playSuccessChirp();
    setCurrentTab('deck');
  };

  const handleDuplicateProfile = (profileId: string) => {
    const original = deckState.profiles.find((p) => p.id === profileId);
    if (!original) return;

    const dupId = `profile_${Date.now()}`;
    const duplicate: Profile = {
      ...original,
      id: dupId,
      name: `${original.name} (Copy)`,
      root_keys: { ...original.root_keys },
      folders: original.folders.map((f) => ({ ...f, id: `folder_${Date.now()}_${Math.random()}` })),
    };

    persistState({
      ...deckState,
      profiles: [...deckState.profiles, duplicate],
    });
  };

  const handleRenameProfile = (profileId: string, newName: string) => {
    const updatedProfiles = deckState.profiles.map((p) =>
      p.id === profileId ? { ...p, name: newName } : p
    );
    persistState({ ...deckState, profiles: updatedProfiles });
  };

  const handleDeleteProfile = (profileId: string) => {
    if (deckState.profiles.length <= 1) return;
    const remaining = deckState.profiles.filter((p) => p.id !== profileId);
    const newActive =
      deckState.active_profile_id === profileId ? remaining[0].id : deckState.active_profile_id;

    persistState({
      ...deckState,
      active_profile_id: newActive,
      active_folder_id: null,
      profiles: remaining,
    });
  };

  const handleRefreshHardware = async () => {
    try {
      const report: HardwareDetectionReport = await invoke('detect_hardware');
      setDetectionReport(report);
      playKeyClickSound();
    } catch (err) {
      console.error('Failed to scan hardware:', err);
    }
  };

  const handleOnboardingComplete = (hotkey: HotkeyConfig) => {
    const updated: DeckState = {
      ...deckState,
      settings: {
        ...deckState.settings,
        activation_hotkey: hotkey,
        onboarding_completed: true,
      },
    };
    persistState(updated);
    setShowOnboarding(false);
  };

  const handleResetDefaults = async () => {
    try {
      const fresh: DeckState = await invoke('reset_config');
      setDeckState(fresh);
      playSuccessChirp();
    } catch (err) {
      console.error('Failed to reset config:', err);
    }
  };

  const handleExportConfig = () => {
    const jsonStr = JSON.stringify(deckState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numpad_deck_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSuccessChirp();
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed: DeckState = JSON.parse(event.target?.result as string);
            await persistState(parsed);
            playSuccessChirp();
          } catch (err) {
            alert('Invalid configuration file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleApplyPreset = (
    title: string,
    icon: string,
    accent_color: string,
    action: ActionConfig
  ) => {
    handleUpdateButtonConfig({
      ...currentKeyConfig,
      title,
      icon,
      accent_color,
      action,
    });
    playSuccessChirp();
    setCurrentTab('deck');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0A0C10',
        overflow: 'hidden',
        color: '#F8FAFC',
      }}
    >
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        deckState={deckState}
        onToggleDeckMode={handleToggleDeckMode}
        onSelectProfile={handleSelectProfile}
      />

      {/* 2. Central Area */}
      {currentTab === 'deck' && (
        <>
          <NumpadGrid
            deckState={deckState}
            activeProfile={activeProfile}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
            physicallyPressedKey={physicallyPressedKey}
            onNavigateFolder={handleNavigateFolder}
          />

          {/* 3. Right Configuration Panel */}
          <ButtonEditor
            key={`${deckState.active_profile_id}_${deckState.active_folder_id || 'root'}_${selectedKey}`}
            selectedKey={selectedKey}
            buttonConfig={currentKeyConfig}
            activeProfile={activeProfile}
            profiles={deckState.profiles}
            onUpdateConfig={handleUpdateButtonConfig}
            onTestExecute={handleTestExecute}
            onCreateFolder={handleCreateFolder}
          />
        </>
      )}

      {currentTab === 'profiles' && (
        <ProfilesModal
          deckState={deckState}
          onSelectProfile={(id) => {
            handleSelectProfile(id);
            setCurrentTab('deck');
          }}
          onCreateProfile={handleCreateProfile}
          onDuplicateProfile={handleDuplicateProfile}
          onRenameProfile={handleRenameProfile}
          onDeleteProfile={handleDeleteProfile}
          onExportConfig={handleExportConfig}
          onImportConfig={handleImportConfig}
        />
      )}

      {currentTab === 'actions' && (
        <ActionLibrary
          selectedKey={selectedKey}
          onApplyPreset={handleApplyPreset}
        />
      )}

      {currentTab === 'tester' && (
        <KeyboardTester
          detectionReport={detectionReport}
          onRefreshHardware={handleRefreshHardware}
          recentTestEvents={recentTestEvents}
          lastTestedKey={lastTestedKey}
          isDeckActive={deckState.is_deck_active}
          onToggleDeckMode={handleToggleDeckMode}
          lastRawKey={lastRawKey}
          onToggleNumlock={handleToggleNumlock}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsModal
          deckState={deckState}
          onUpdateSettings={(newSettings) =>
            persistState({ ...deckState, settings: newSettings })
          }
          onExportConfig={handleExportConfig}
          onImportConfig={handleImportConfig}
          onResetDefaults={handleResetDefaults}
          onLaunchOnboarding={() => setShowOnboarding(true)}
          onToggleNumlock={handleToggleNumlock}
          isNumlockOn={detectionReport?.numlock_on ?? true}
        />
      )}

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          detectionReport={detectionReport}
          onRefreshHardware={handleRefreshHardware}
          lastTestedKey={lastTestedKey}
          lastRawKey={lastRawKey}
          activationHotkey={deckState.settings.activation_hotkey}
          onToggleDeckMode={handleToggleDeckMode}
          isDeckActive={deckState.is_deck_active}
          onToggleNumlock={handleToggleNumlock}
          compactLaptopMode={deckState.settings.compact_laptop_mode}
          onToggleCompactMode={handleToggleCompactMode}
        />
      )}
    </div>
  );
};

export default App;
