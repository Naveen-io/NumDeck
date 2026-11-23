import React, { useState, useRef } from 'react';
import { Profile } from '../types';
import { IconRenderer } from './IconRenderer';
import { invoke } from '@tauri-apps/api/core';
import { 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Check, 
  Layers,
  Download,
  Upload,
  AppWindow,
  RotateCcw
} from 'lucide-react';

interface ProfilesModalProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onSaveProfiles: (profiles: Profile[]) => void;
  onClose: () => void;
}

const DEFAULT_PROFILE_IDS = ['general', 'gaming', 'coding', 'streaming', 'editing', 'productivity'];

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveProfiles,
  onClose,
}) => {
  const [profileList, setProfileList] = useState<Profile[]>(profiles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editApp, setEditApp] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateProfile = () => {
    const newId = `profile_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name: `Profile ${profileList.length + 1}`,
      icon: 'LayoutGrid',
      keys: {},
      layer_b_keys: {},
      folders: [],
    };
    const updated = [...profileList, newProfile];
    setProfileList(updated);
    onSaveProfiles(updated);
    onSelectProfile(newId);
    showNotice('New profile created');
  };

  const handleDuplicateProfile = (source: Profile) => {
    const newId = `${source.id}_copy_${Date.now()}`;
    const duplicated: Profile = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      keys: JSON.parse(JSON.stringify(source.keys)),
      layer_b_keys: source.layer_b_keys ? JSON.parse(JSON.stringify(source.layer_b_keys)) : {},
      folders: JSON.parse(JSON.stringify(source.folders || [])),
      app_association: source.app_association,
    };
    const updated = [...profileList, duplicated];
    setProfileList(updated);
    onSaveProfiles(updated);
    showNotice(`Duplicated "${source.name}"`);
  };

  const handleDeleteProfile = (id: string) => {
    if (profileList.length <= 1) {
      return;
    }
    const updated = profileList.filter((p) => p.id !== id);
    setProfileList(updated);
    onSaveProfiles(updated);
    setConfirmDeleteId(null);
    if (activeProfileId === id) {
      onSelectProfile(updated[0].id);
    }
    showNotice('Profile deleted');
  };

  const startRename = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditApp(p.app_association || '');
  };

  const saveRename = (id: string) => {
    const updated = profileList.map((p) =>
      p.id === id
        ? {
            ...p,
            name: editName.trim() || p.name,
            app_association: editApp.trim() ? editApp.trim() : undefined,
          }
        : p
    );
    setProfileList(updated);
    onSaveProfiles(updated);
    setEditingId(null);
    showNotice('Profile updated');
  };

  const handleResetProfile = async (id: string) => {
    try {
      const defaultProfile = await invoke<Profile>('reset_profile_to_default', { profileId: id });
      const updated = profileList.map((p) => (p.id === id ? defaultProfile : p));
      setProfileList(updated);
      onSaveProfiles(updated);
      showNotice(`Reset "${defaultProfile.name}" to defaults`);
    } catch (e) {
      console.warn('Reset profile failed (falling back):', e);
    }
  };

  const handleResetAllProfiles = async () => {
    if (!window.confirm('Reset all profiles to factory defaults? Any custom assignments will be overwritten.')) {
      return;
    }
    try {
      const defaults = await invoke<Profile[]>('reset_all_profiles_to_default');
      setProfileList(defaults);
      onSaveProfiles(defaults);
      showNotice('All profiles reset to factory defaults');
    } catch (e) {
      console.warn('Reset all profiles failed:', e);
    }
  };

  // Export single profile
  const handleExportProfile = (p: Profile) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(p, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeName = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${safeName}.numdeck.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice(`Exported "${p.name}"`);
  };

  // Export all profiles
  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profileList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'numdeck_all_profiles_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotice('All profiles exported');
  };

  // Import profile from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Multiple profiles backup
          const imported = parsed.filter((item) => item && typeof item.name === 'string' && typeof item.keys === 'object');
          if (imported.length === 0) throw new Error('No valid profiles found');
          const updated = [...profileList, ...imported.map((p) => ({ ...p, id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` }))];
          setProfileList(updated);
          onSaveProfiles(updated);
          showNotice(`Imported ${imported.length} profiles`);
        } else if (parsed && typeof parsed.name === 'string' && typeof parsed.keys === 'object') {
          // Single profile
          const newId = `imported_${Date.now()}`;
          const newProfile: Profile = {
            id: newId,
            name: parsed.name,
            icon: parsed.icon || 'LayoutGrid',
            keys: parsed.keys || {},
            folders: parsed.folders || [],
            app_association: parsed.app_association,
          };
          const updated = [...profileList, newProfile];
          setProfileList(updated);
          onSaveProfiles(updated);
          onSelectProfile(newId);
          showNotice(`Imported "${newProfile.name}"`);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        console.error('Import failed:', err);
        showNotice('Invalid profile JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-[#08090C]/80 flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-xl bg-[#0E1118] border border-[#1F2532] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F1F5F9]">Profiles & Workflows</h2>
              <p className="text-[11px] text-[#64748B]">Manage, duplicate, and export shortcut configurations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div className="px-5 py-2 bg-[#1D4ED8]/20 border-b border-[#3B82F6]/30 text-xs text-[#3B82F6] font-semibold flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-[#94A3B8] hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* Profile list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          {profileList.map((p) => {
            const isActive = activeProfileId === p.id;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isActive
                    ? 'bg-[#142036] border-[#3B82F6]'
                    : 'bg-[#131722] border-[#202736] hover:bg-[#171D2B]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 mr-3">
                    <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6] shrink-0">
                      <IconRenderer name={p.icon || 'LayoutGrid'} size={16} />
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Profile Name"
                            className="px-2.5 py-1 bg-[#0B0D12] border border-[#3B82F6] rounded text-xs text-[#F1F5F9] font-semibold flex-1 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(p.id)}
                            className="p-1 text-[#10B981] hover:bg-[#182030] rounded cursor-pointer"
                            title="Save changes"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AppWindow size={12} className="text-[#64748B]" />
                          <input
                            type="text"
                            value={editApp}
                            onChange={(e) => setEditApp(e.target.value)}
                            placeholder="Target App Executable (e.g. code.cmd, obs64.exe)"
                            className="px-2 py-0.5 bg-[#0B0D12] border border-[#202736] rounded text-[11px] text-[#94A3B8] font-mono flex-1 focus:outline-none focus:border-[#3B82F6]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F1F5F9]">{p.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-semibold text-[#3B82F6] bg-[#3B82F6]/15 px-1.5 py-0.5 rounded border border-[#3B82F6]/30">
                              Active
                            </span>
                          )}
                          {p.app_association && (
                            <span className="text-[10px] font-mono text-[#94A3B8] bg-[#182030] px-1.5 py-0.5 rounded border border-[#273348]" title="Associated Application">
                              {p.app_association}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {Object.keys(p.keys || {}).length} keys mapped
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profile actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          onClick={() => onSelectProfile(p.id)}
                          className="py-1 px-2.5 rounded-lg bg-[#182030] hover:bg-[#202B42] text-[#3B82F6] text-xs font-semibold border border-[#2B3A54] cursor-pointer"
                        >
                          Select
                        </button>
                      )}

                      <button
                        onClick={() => startRename(p)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
                        title="Edit profile & application association"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleExportProfile(p)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
                        title="Export profile JSON"
                      >
                        <Download size={13} />
                      </button>

                      <button
                        onClick={() => handleDuplicateProfile(p)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
                        title="Duplicate profile"
                      >
                        <Copy size={13} />
                      </button>

                      {DEFAULT_PROFILE_IDS.includes(p.id) && (
                        <button
                          onClick={() => handleResetProfile(p.id)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#182030] cursor-pointer"
                          title={`Reset "${p.name}" to factory default layout`}
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}

                      {profileList.length > 1 && (
                        confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-[#EF4444]/15 border border-[#EF4444]/40 px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] text-[#EF4444] font-bold">Delete?</span>
                            <button
                              onClick={() => handleDeleteProfile(p.id)}
                              className="text-[10px] font-bold text-white bg-[#EF4444] px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] text-[#94A3B8] px-1 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#182030] cursor-pointer"
                            title="Delete profile"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F2532] bg-[#111520] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateProfile}
              className="py-1.5 px-3 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 border border-[#3B82F6] cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Profile</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-3 rounded-lg bg-[#181E2C] hover:bg-[#222B3E] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-semibold flex items-center gap-1.5 border border-[#202736] cursor-pointer"
              title="Import profile from .numdeck.json or backup file"
            >
              <Upload size={13} />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportAll}
              className="py-1.5 px-3 rounded-lg bg-[#181E2C] hover:bg-[#222B3E] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-semibold flex items-center gap-1.5 border border-[#202736] cursor-pointer"
              title="Backup all profiles to JSON"
            >
              <Download size={13} />
              <span>Export All</span>
            </button>

            <button
              onClick={handleResetAllProfiles}
              className="py-1.5 px-3 rounded-lg bg-[#181E2C] hover:bg-[#222B3E] text-[#94A3B8] hover:text-[#EF4444] text-xs font-semibold flex items-center gap-1.5 border border-[#202736] cursor-pointer"
              title="Reset all profiles to factory defaults"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] bg-[#181E2C] hover:bg-[#222B3E] border border-[#202736] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
