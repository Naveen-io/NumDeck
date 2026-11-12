import React, { useState } from 'react';
import { Profile, DeckState } from '../types';
import { IconRenderer } from './IconRenderer';
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  ArrowRight,
} from 'lucide-react';

interface ProfilesModalProps {
  deckState: DeckState;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (name: string, color: string, icon: string) => void;
  onDuplicateProfile: (profileId: string) => void;
  onRenameProfile: (profileId: string, newName: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onExportConfig?: () => void;
  onImportConfig?: () => void;
}

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  deckState,
  onSelectProfile,
  onCreateProfile,
  onDuplicateProfile,
  onRenameProfile,
  onDeleteProfile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState('#3B82F6');
  const newProfileIcon = 'Sliders';

  const startRename = (profile: Profile) => {
    setEditingId(profile.id);
    setEditingName(profile.name);
  };

  const commitRename = (profileId: string) => {
    if (editingName.trim()) {
      onRenameProfile(profileId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCreate = () => {
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim(), newProfileColor, newProfileIcon);
      setNewProfileName('');
      setShowCreateModal(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '32px',
        backgroundColor: '#0B0D12',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Profiles Management
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              Organize dedicated button pages for gaming, streaming, video editing, or programming.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              <span>Create Profile</span>
            </button>
          </div>
        </div>

        {/* Profiles Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {deckState.profiles.map((profile) => {
            const isActive = profile.id === deckState.active_profile_id;
            const keyCount = Object.values(profile.root_keys || {}).filter(
              (btn) => btn && btn.action && btn.action.type !== 'none'
            ).length;

            return (
              <div
                key={profile.id}
                style={{
                  backgroundColor: '#12151C',
                  borderRadius: '12px',
                  border: isActive ? `2px solid ${profile.color || '#3B82F6'}` : '1px solid #1F2432',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: isActive
                    ? `0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px ${profile.color}25`
                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: `${profile.color || '#3B82F6'}20`,
                        border: `1px solid ${profile.color || '#3B82F6'}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: profile.color || '#3B82F6',
                      }}
                    >
                      <IconRenderer name={profile.icon || 'Sliders'} size={18} color={profile.color} />
                    </div>

                    {editingId === profile.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && commitRename(profile.id)}
                          autoFocus
                          style={{
                            backgroundColor: '#1C2230',
                            border: '1px solid #3B82F6',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            width: '120px',
                          }}
                        />
                        <button
                          onClick={() => commitRename(profile.id)}
                          style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                          {profile.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {keyCount} keys active • {profile.folders.length} folder(s)
                        </div>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#10B98125',
                        color: '#34D399',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #10B98140',
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #1B202D',
                  }}
                >
                  {!isActive ? (
                    <button
                      onClick={() => onSelectProfile(profile.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#1C2230',
                        border: '1px solid #2B3447',
                        color: '#F8FAFC',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Switch to Deck</span>
                      <ArrowRight size={12} />
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
                      Currently Loaded
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => startRename(profile)}
                      title="Rename Profile"
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: '#181C26',
                        border: '1px solid #283042',
                        color: '#94A3B8',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDuplicateProfile(profile.id)}
                      title="Duplicate Profile"
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: '#181C26',
                        border: '1px solid #283042',
                        color: '#94A3B8',
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} />
                    </button>
                    {deckState.profiles.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete profile "${profile.name}"?`)) {
                            onDeleteProfile(profile.id);
                          }
                        }}
                        title="Delete Profile"
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          backgroundColor: '#181C26',
                          border: '1px solid #283042',
                          color: '#EF4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Profile Modal */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '400px',
                backgroundColor: '#12151C',
                borderRadius: '12px',
                border: '1px solid #2A3142',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Create New Profile
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                  Profile Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flight Simulator, Blender"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    backgroundColor: '#181C26',
                    border: '1px solid #2E384D',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                  Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'].map((c) => (
                    <div
                      key={c}
                      onClick={() => setNewProfileColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: c,
                        cursor: 'pointer',
                        border: newProfileColor === c ? '2px solid #FFFFFF' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'none',
                    border: '1px solid #2A3142',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
