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

  const handleCreateProfile = () => {
    const newId = `profile_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name: `New Profile ${profileList.length + 1}`,
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
      alert('Cannot delete the only remaining profile.');
      return;
    }
    const updated = profileList.filter((p) => p.id !== id);
    setProfileList(updated);
    onSaveProfiles(updated);
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
    <div className="fixed inset-0 bg-[#08090C]/80 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-lg bg-[#0D0F14] border border-[#252C39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#397BFF]/15 border border-[#397BFF]/40 flex items-center justify-center text-[#397BFF]">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F6FA]">Profile Management</h2>
              <p className="text-xs text-[#929CAC]">Switch or customize action decks for gaming, coding, editing, and streaming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#626D7E] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile list */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {profileList.map((p) => {
            const isActive = activeProfileId === p.id;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-[#14264A]/70 border-[#397BFF]/60 shadow-sm'
                    : 'bg-[#12151C] border-[#252C39] hover:bg-[#191E28]'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 mr-3">
                  <div className="w-8 h-8 rounded-lg bg-[#191E28] border border-[#252C39] flex items-center justify-center text-[#397BFF]">
                    <IconRenderer name={p.icon || 'LayoutGrid'} size={16} />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 bg-[#08090C] border border-[#397BFF] rounded text-xs text-[#F4F6FA] font-semibold flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(p.id)}
                        className="p-1 text-[#65C991] hover:bg-[#191E28] rounded"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F4F6FA]">{p.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-[#397BFF] bg-[#397BFF]/20 px-1.5 py-0.5 rounded border border-[#397BFF]/30">
                            Active Deck
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#626D7E] font-mono">
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
                      className="py-1 px-2.5 rounded-lg bg-[#397BFF]/15 hover:bg-[#397BFF]/30 text-[#397BFF] text-xs font-semibold transition-all"
                    >
                      Activate
                    </button>
                  )}

                  <button
                    onClick={() => startRename(p)}
                    className="p-1.5 rounded-lg text-[#929CAC] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all"
                    title="Rename profile"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDuplicateProfile(p)}
                    className="p-1.5 rounded-lg text-[#929CAC] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all"
                    title="Duplicate profile"
                  >
                    <Copy size={13} />
                  </button>

                  {profileList.length > 1 && (
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="p-1.5 rounded-lg text-[#626D7E] hover:text-[#ED7777] hover:bg-[#191E28] transition-all"
                      title="Delete profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Add New Profile */}
        <div className="p-5 border-t border-[#252C39] bg-[#12151C]/60 flex items-center justify-between">
          <button
            onClick={handleCreateProfile}
            className="py-2 px-3.5 rounded-xl bg-[#397BFF] hover:bg-[#5B91FF] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Create New Profile</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] bg-[#191E28] hover:bg-[#252C39] border border-[#252C39] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
