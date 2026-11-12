import React, { useState } from 'react';
import { KeyAssignment, ActionConfig, ActionStep, Profile } from '../types';
import { IconRenderer } from './IconRenderer';
import { invoke } from '@tauri-apps/api/core';
import { 
  X, 
  Check, 
  Play, 
  Plus, 
  Trash2, 
  ExternalLink,
  Laptop,
  FolderOpen,
  Keyboard as KeyIcon,
  Music,
  Layers,
  ArrowRight,
  FolderSearch
} from 'lucide-react';

interface ActionModalProps {
  keyId: string;
  initialAssignment?: KeyAssignment;
  profiles: Profile[];
  onSave: (assignment: KeyAssignment) => void;
  onCancel: () => void;
  onTest: (action: ActionConfig) => void;
}

const BRAND_ICONS = [
  'chrome', 'vscode', 'terminal', 'discord', 'spotify', 'steam', 
  'obs', 'explorer', 'notepad', 'firefox', 'edge', 'visualstudio',
  'photoshop', 'premiere', 'blender', 'vlc'
];

const SYSTEM_ICONS = [
  'PlayPause', 'Volume2', 'Volume1', 'VolumeX', 'SkipForward', 'SkipBack',
  'Camera', 'Activity', 'Lock', 'Clipboard', 'Settings', 'Layers',
  'Folder', 'FileText', 'Calculator', 'Power', 'Command'
];

const PRESET_COLORS = [
  '#397BFF', '#65C991', '#E9B86A', '#ED7777', '#5865F2', '#1DB954', '#007ACC', '#4EC9B0'
];

type ActionCategory = 'launch' | 'open' | 'hotkey' | 'text' | 'media' | 'multi' | 'nav';

export const ActionModal: React.FC<ActionModalProps> = ({
  keyId,
  initialAssignment,
  profiles,
  onSave,
  onCancel,
  onTest,
}) => {
  const [label, setLabel] = useState(initialAssignment?.label || 'New Action');
  const [icon, setIcon] = useState(initialAssignment?.icon || 'chrome');
  const [color, setColor] = useState(initialAssignment?.color || '#397BFF');
  const [isExtracting, setIsExtracting] = useState(false);

  const getCategoryFromAction = (action?: ActionConfig): ActionCategory => {
    if (!action) return 'launch';
    switch (action.type) {
      case 'LaunchApp': return 'launch';
      case 'OpenPath': return 'open';
      case 'Hotkey': return 'hotkey';
      case 'TypeText': return 'text';
      case 'SystemMedia': return 'media';
      case 'MultiAction': return 'multi';
      case 'SwitchProfile':
      case 'NavigateFolder':
      case 'ToggleDeckMode':
      case 'BackToRootFolder': return 'nav';
      default: return 'launch';
    }
  };

  const [category, setCategory] = useState<ActionCategory>(
    getCategoryFromAction(initialAssignment?.action)
  );

  // Form states
  const [launchPath, setLaunchPath] = useState(
    initialAssignment?.action?.type === 'LaunchApp' ? initialAssignment.action.payload.path : 'calc.exe'
  );
  const [launchArgs, setLaunchArgs] = useState(
    initialAssignment?.action?.type === 'LaunchApp' ? initialAssignment.action.payload.arguments || '' : ''
  );

  const [openPath, setOpenPath] = useState(
    initialAssignment?.action?.type === 'OpenPath' ? initialAssignment.action.payload.path : 'https://www.google.com'
  );

  const [hotkeyMods, setHotkeyMods] = useState<string[]>(
    initialAssignment?.action?.type === 'Hotkey' ? initialAssignment.action.payload.modifiers : ['ctrl']
  );
  const [hotkeyKey, setHotkeyKey] = useState(
    initialAssignment?.action?.type === 'Hotkey' ? initialAssignment.action.payload.key : 'C'
  );

  const [typeText, setTypeText] = useState(
    initialAssignment?.action?.type === 'TypeText' ? initialAssignment.action.payload.text : 'Welcome to Numpad Deck'
  );

  const [mediaCommand, setMediaCommand] = useState(
    initialAssignment?.action?.type === 'SystemMedia' ? initialAssignment.action.payload.command : 'play_pause'
  );

  const [multiSteps, setMultiSteps] = useState<ActionStep[]>(
    initialAssignment?.action?.type === 'MultiAction'
      ? initialAssignment.action.payload.steps
      : [
          { action: { type: 'SystemMedia', payload: { command: 'play_pause' } }, delay_ms: 100 },
          { action: { type: 'TypeText', payload: { text: 'Done' } }, delay_ms: 50 },
        ]
  );

  const [navTargetProfile, setNavTargetProfile] = useState(
    initialAssignment?.action?.type === 'SwitchProfile' ? initialAssignment.action.payload.profile_id : profiles[0]?.id || 'general'
  );

  // Browse executable via native Windows file dialog
  const handleBrowseExecutable = async () => {
    try {
      const selected = await invoke<string | null>('browse_executable_file');
      if (selected) {
        setLaunchPath(selected);

        // Derive label from filename
        const parts = selected.split(/\\|\//);
        const filename = parts[parts.length - 1] || '';
        const cleanName = filename.replace(/\.exe$/i, '');
        if (!label || label === 'New Action') {
          setLabel(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }

        // Attempt Windows icon extraction
        setIsExtracting(true);
        try {
          const iconDataUri = await invoke<string>('extract_app_icon', { path: selected });
          if (iconDataUri) {
            setIcon(iconDataUri);
          }
        } catch (e) {
          console.warn('Icon extraction fell back to default:', e);
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.error('File browse failed:', err);
    }
  };

  const buildCurrentAction = (): ActionConfig => {
    switch (category) {
      case 'launch':
        return {
          type: 'LaunchApp',
          payload: { path: launchPath, arguments: launchArgs ? launchArgs : undefined },
        };
      case 'open':
        return {
          type: 'OpenPath',
          payload: { path: openPath },
        };
      case 'hotkey':
        return {
          type: 'Hotkey',
          payload: { modifiers: hotkeyMods, key: hotkeyKey.trim().toUpperCase() },
        };
      case 'text':
        return {
          type: 'TypeText',
          payload: { text: typeText },
        };
      case 'media':
        return {
          type: 'SystemMedia',
          payload: { command: mediaCommand },
        };
      case 'multi':
        return {
          type: 'MultiAction',
          payload: { steps: multiSteps },
        };
      case 'nav':
        return {
          type: 'SwitchProfile',
          payload: { profile_id: navTargetProfile },
        };
    }
  };

  const handleSave = () => {
    const action = buildCurrentAction();
    onSave({
      key_id: keyId,
      label,
      icon,
      color,
      action,
    });
  };

  const handleTest = () => {
    onTest(buildCurrentAction());
  };

  const toggleModifier = (mod: string) => {
    if (hotkeyMods.includes(mod)) {
      setHotkeyMods(hotkeyMods.filter((m) => m !== mod));
    } else {
      setHotkeyMods([...hotkeyMods, mod]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#08090C]/85 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0D0F14] border border-[#252C39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-[#191E28] border border-[#252C39] flex items-center justify-center shadow-inner"
              style={{ borderColor: `${color}50` }}
            >
              <IconRenderer name={icon} size={22} color={color} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F6FA]">Configure Key Action</h2>
              <span className="text-xs text-[#929CAC] font-mono">Target Key: {keyId}</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#626D7E] hover:text-[#F4F6FA] hover:bg-[#191E28] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Label & Accent Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono font-bold text-[#929CAC] uppercase block mb-1.5">
                Key Display Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 bg-[#12151C] border border-[#252C39] rounded-lg text-xs font-semibold text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                placeholder="e.g. Browser, Mute Audio"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-[#929CAC] uppercase block mb-1.5">
                Accent Theme
              </label>
              <div className="flex items-center gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      color === c ? 'scale-110 border-white ring-2 ring-white/25' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recognizable Application Icons Selector */}
          <div>
            <label className="text-[11px] font-mono font-bold text-[#929CAC] uppercase block mb-1.5">
              Select Application / Function Icon
            </label>
            <div className="space-y-2 p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
              {/* Brand Icons */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-mono text-[#626D7E] uppercase">Popular Software:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BRAND_ICONS.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setIcon(brand)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      icon === brand
                        ? 'bg-[#397BFF]/20 border-[#397BFF] shadow-sm'
                        : 'bg-[#191E28] border-transparent hover:bg-[#252C39]'
                    }`}
                    title={brand.toUpperCase()}
                  >
                    <IconRenderer name={brand} size={18} />
                  </button>
                ))}
              </div>

              {/* System Action Icons */}
              <div className="flex items-center gap-1.5 pt-2 mb-1 border-t border-[#252C39]/60">
                <span className="text-[10px] font-mono text-[#626D7E] uppercase">System Glyphs:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_ICONS.map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setIcon(sys)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      icon === sys
                        ? 'bg-[#397BFF]/20 border-[#397BFF] text-[#397BFF]'
                        : 'bg-[#191E28] border-transparent text-[#929CAC] hover:text-[#F4F6FA]'
                    }`}
                    title={sys}
                  >
                    <IconRenderer name={sys} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <label className="text-[11px] font-mono font-bold text-[#929CAC] uppercase block mb-1.5">
              Action Category
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#12151C] border border-[#252C39]">
              {[
                { id: 'launch', label: 'App Launch', icon: Laptop },
                { id: 'open', label: 'Open Path', icon: FolderOpen },
                { id: 'hotkey', label: 'Hotkey', icon: KeyIcon },
                { id: 'media', label: 'Media', icon: Music },
                { id: 'text', label: 'Type Text', icon: ExternalLink },
                { id: 'multi', label: 'Multi-Action', icon: Layers },
                { id: 'nav', label: 'Profile', icon: ArrowRight },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id as ActionCategory)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#397BFF] text-white shadow-sm'
                        : 'text-[#929CAC] hover:text-[#F4F6FA] hover:bg-[#191E28]'
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Category Configurations */}
          <div className="p-4 rounded-xl bg-[#12151C] border border-[#252C39]">
            {category === 'launch' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#929CAC]">
                      Application Executable Path
                    </label>
                    <button
                      type="button"
                      onClick={handleBrowseExecutable}
                      className="text-xs font-semibold text-[#397BFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FolderSearch size={13} />
                      <span>{isExtracting ? 'Extracting Icon...' : 'Browse Executable (.exe)...'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={launchPath}
                    onChange={(e) => setLaunchPath(e.target.value)}
                    className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                    placeholder="e.g. C:\Program Files\...\app.exe, wt.exe, calc.exe"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#929CAC] block mb-1">
                    Command Arguments (Optional)
                  </label>
                  <input
                    type="text"
                    value={launchArgs}
                    onChange={(e) => setLaunchArgs(e.target.value)}
                    className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                    placeholder="e.g. --new-window, -v"
                  />
                </div>
              </div>
            )}

            {category === 'open' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#929CAC] block mb-1">
                  File, Folder Path, URL, or Protocol
                </label>
                <input
                  type="text"
                  value={openPath}
                  onChange={(e) => setOpenPath(e.target.value)}
                  className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                  placeholder="e.g. https://google.com, steam://open/main, C:\Users"
                />
              </div>
            )}

            {category === 'hotkey' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#929CAC] block mb-1">Modifiers</label>
                <div className="flex gap-2">
                  {['ctrl', 'alt', 'shift', 'win'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModifier(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border transition-all cursor-pointer ${
                        hotkeyMods.includes(m)
                          ? 'bg-[#397BFF] border-[#397BFF] text-white'
                          : 'bg-[#08090C] border-[#252C39] text-[#929CAC]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#929CAC] block mb-1">Key Name</label>
                  <input
                    type="text"
                    value={hotkeyKey}
                    onChange={(e) => setHotkeyKey(e.target.value)}
                    className="w-28 px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono uppercase text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                    placeholder="e.g. C, S, ESC, F1"
                  />
                </div>
              </div>
            )}

            {category === 'media' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#929CAC] block">System Media Command</label>
                <select
                  value={mediaCommand}
                  onChange={(e) => setMediaCommand(e.target.value)}
                  className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                >
                  <option value="play_pause">Play / Pause (VK_MEDIA_PLAY_PAUSE)</option>
                  <option value="volume_up">Volume Up (VK_VOLUME_UP)</option>
                  <option value="volume_down">Volume Down (VK_VOLUME_DOWN)</option>
                  <option value="mute">Mute / Unmute (VK_VOLUME_MUTE)</option>
                  <option value="next_track">Next Track (VK_MEDIA_NEXT_TRACK)</option>
                  <option value="prev_track">Previous Track (VK_MEDIA_PREV_TRACK)</option>
                </select>
              </div>
            )}

            {category === 'text' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#929CAC] block mb-1">
                  Text to Type (Unicode Direct Simulation)
                </label>
                <textarea
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                  placeholder="Enter text string to be automatically typed..."
                />
              </div>
            )}

            {category === 'multi' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#929CAC]">Sequential Actions</label>
                  <button
                    type="button"
                    onClick={() =>
                      setMultiSteps([
                        ...multiSteps,
                        { action: { type: 'SystemMedia', payload: { command: 'play_pause' } }, delay_ms: 100 },
                      ])
                    }
                    className="text-[11px] font-semibold text-[#397BFF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Step
                  </button>
                </div>

                <div className="space-y-2">
                  {multiSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#08090C] border border-[#252C39]"
                    >
                      <span className="text-[10px] font-mono text-[#626D7E] w-4">{idx + 1}</span>
                      <span className="text-xs font-mono text-[#F4F6FA] flex-1 truncate">
                        {step.action.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={step.delay_ms}
                          onChange={(e) => {
                            const newSteps = [...multiSteps];
                            newSteps[idx].delay_ms = parseInt(e.target.value) || 0;
                            setMultiSteps(newSteps);
                          }}
                          className="w-16 px-1.5 py-0.5 bg-[#12151C] border border-[#252C39] rounded text-[11px] font-mono text-[#F4F6FA]"
                          placeholder="ms"
                        />
                        <span className="text-[10px] text-[#626D7E]">ms</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMultiSteps(multiSteps.filter((_, i) => i !== idx))}
                        className="text-[#626D7E] hover:text-[#ED7777] p-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {category === 'nav' && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#929CAC] block">Target Profile</label>
                <select
                  value={navTargetProfile}
                  onChange={(e) => setNavTargetProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-semibold text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#252C39] flex items-center justify-between bg-[#12151C]/60">
          <button
            type="button"
            onClick={handleTest}
            className="py-2 px-3.5 rounded-lg text-xs font-bold text-[#397BFF] bg-[#397BFF]/10 hover:bg-[#397BFF]/20 border border-[#397BFF]/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>Test Action</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="py-2 px-4 rounded-lg text-xs font-semibold text-[#929CAC] hover:text-[#F4F6FA] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 rounded-lg text-xs font-bold text-white bg-[#397BFF] hover:bg-[#5B91FF] shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Save Action</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
