import React, { useState } from 'react';
import { Profile } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Check, 
  Layers
} from 'lucide-react';

interface ProfilesModalProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onSaveProfiles: (profiles: Profile[]) => void;
  onClose: () => void;
}

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreateProfile = () => {
    const newId = `profile_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name: `Profile ${profileList.length + 1}`,
      icon: 'LayoutGrid',
      keys: {},
      folders: [],
    };
    const updated = [...profileList, newProfile];
    setProfileList(updated);
    onSaveProfiles(updated);
    onSelectProfile(newId);
  };

  const handleDuplicateProfile = (source: Profile) => {
    const newId = `${source.id}_copy_${Date.now()}`;
    const duplicated: Profile = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      keys: JSON.parse(JSON.stringify(source.keys)),
      folders: JSON.parse(JSON.stringify(source.folders || [])),
    };
    const updated = [...profileList, duplicated];
    setProfileList(updated);
    onSaveProfiles(updated);
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
  };

  const startRename = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveRename = (id: string) => {
    const updated = profileList.map((p) =>
      p.id === id ? { ...p, name: editName.trim() || p.name } : p
    );
    setProfileList(updated);
    onSaveProfiles(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-[#08090C]/80 flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-lg bg-[#0E1118] border border-[#1F2532] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F1F5F9]">Profiles</h2>
              <p className="text-[11px] text-[#64748B]">Create and switch key layouts for your workflows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          {profileList.map((p) => {
            const isActive = activeProfileId === p.id;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isActive
                    ? 'bg-[#142036] border-[#3B82F6]'
                    : 'bg-[#131722] border-[#202736] hover:bg-[#171D2B]'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 mr-3">
                  <div className="w-7 h-7 rounded-lg bg-[#182030] border border-[#2B3A54] flex items-center justify-center text-[#3B82F6]">
                    <IconRenderer name={p.icon || 'LayoutGrid'} size={15} />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 bg-[#0B0D12] border border-[#3B82F6] rounded text-xs text-[#F1F5F9] font-semibold flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(p.id)}
                        className="p-1 text-[#10B981] hover:bg-[#182030] rounded cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
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
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        {Object.keys(p.keys || {}).length} keys mapped
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile actions */}
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
                    title="Rename"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDuplicateProfile(p)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>

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
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F2532] bg-[#111520] flex items-center justify-between">
          <button
            onClick={handleCreateProfile}
            className="py-1.5 px-3.5 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 border border-[#3B82F6] cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Profile</span>
          </button>

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
