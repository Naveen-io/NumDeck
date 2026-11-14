import React, { useState, useRef } from 'react';
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
  FolderSearch,
  Search,
  Upload
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
  'photoshop', 'premiere', 'blender', 'vlc', 'excel', 'word', 'teams', 'slack'
];

const WEB_ICONS = [
  'youtube', 'twitch', 'github', 'notion', 'gmail',
  'calendar', 'drive', 'instagram', 'x', 'reddit'
];

const SYSTEM_ICONS = [
  'PlayPause', 'Volume2', 'Volume1', 'VolumeX', 'SkipForward', 'SkipBack',
  'Camera', 'Activity', 'Lock', 'Clipboard', 'Settings', 'Layers',
  'Folder', 'FileText', 'Calculator', 'Power', 'Command'
];

const PRESET_COLORS = [
  '#397BFF', '#65C991', '#E9B86A', '#ED7777', '#5865F2', '#1DB954', '#007ACC', '#4EC9B0', '#FF0000', '#9146FF', '#FFFFFF'
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
  const [iconCategory, setIconCategory] = useState<'all' | 'apps' | 'web' | 'system'>('all');
  const [iconSearch, setIconSearch] = useState('');
  const customIconInputRef = useRef<HTMLInputElement | null>(null);

  const detectUrlIcon = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setIcon('youtube');
      setColor('#FF0000');
      if (!label || label === 'New Action') setLabel('YouTube');
    } else if (lower.includes('twitch.tv')) {
      setIcon('twitch');
      setColor('#9146FF');
      if (!label || label === 'New Action') setLabel('Twitch');
    } else if (lower.includes('github.com')) {
      setIcon('github');
      setColor('#24292F');
      if (!label || label === 'New Action') setLabel('GitHub');
    } else if (lower.includes('notion.so')) {
      setIcon('notion');
      setColor('#FFFFFF');
      if (!label || label === 'New Action') setLabel('Notion');
    } else if (lower.includes('mail.google.com') || lower.includes('gmail.com')) {
      setIcon('gmail');
      setColor('#EA4335');
      if (!label || label === 'New Action') setLabel('Gmail');
    } else if (lower.includes('calendar.google.com')) {
      setIcon('calendar');
      setColor('#4285F4');
      if (!label || label === 'New Action') setLabel('Google Calendar');
    } else if (lower.includes('drive.google.com')) {
      setIcon('drive');
      setColor('#0F9D58');
      if (!label || label === 'New Action') setLabel('Google Drive');
    } else if (lower.includes('discord.com') || lower.includes('discord://')) {
      setIcon('discord');
      setColor('#5865F2');
      if (!label || label === 'New Action') setLabel('Discord');
    } else if (lower.includes('spotify.com') || lower.includes('spotify:')) {
      setIcon('spotify');
      setColor('#1DB954');
      if (!label || label === 'New Action') setLabel('Spotify');
    } else if (lower.includes('reddit.com')) {
      setIcon('reddit');
      setColor('#FF4500');
      if (!label || label === 'New Action') setLabel('Reddit');
    } else if (lower.includes('instagram.com')) {
      setIcon('instagram');
      setColor('#E1306C');
      if (!label || label === 'New Action') setLabel('Instagram');
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      setIcon('x');
      setColor('#FFFFFF');
      if (!label || label === 'New Action') setLabel('X / Twitter');
    }
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setIcon(event.target.result);
        if (!label || label === 'New Action') {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setLabel(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
    <div className="fixed inset-0 bg-[#08090C]/80 flex items-center justify-center p-6 z-50 select-none">
      <div className="w-full max-w-xl bg-[#0E1118] border border-[#1F2532] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-[#182030] border border-[#2B3A54] flex items-center justify-center"
              style={{ borderColor: `${color}80` }}
            >
              <IconRenderer name={icon} size={22} color={color} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F1F5F9]">Configure Key Action</h2>
              <span className="text-xs text-[#64748B] font-mono">Key: {keyId}</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#182030] cursor-pointer"
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono font-bold text-[#929CAC] uppercase">
                Select Icon
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={customIconInputRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCustomIconUpload}
                />
                <button
                  type="button"
                  onClick={() => customIconInputRef.current?.click()}
                  className="text-xs font-semibold text-[#397BFF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Upload Custom (PNG/SVG)</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-xl bg-[#12151C] border border-[#252C39]">
              {/* Category Filter Pills and Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#08090C] border border-[#252C39]">
                  {(['all', 'apps', 'web', 'system'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIconCategory(cat)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        iconCategory === cat
                          ? 'bg-[#397BFF] text-white shadow-xs'
                          : 'text-[#929CAC] hover:text-[#F4F6FA]'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat === 'apps' ? 'Apps' : cat === 'web' ? 'Websites' : 'System'}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-[200px]">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="w-full pl-7 pr-2 py-1 bg-[#08090C] border border-[#252C39] rounded-md text-[11px] text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                  />
                </div>
              </div>

              {/* Uploaded Icon Preview Pill if custom */}
              {icon.startsWith('data:image/') && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#182030] border border-[#2B3A54]">
                  <div className="w-7 h-7 rounded bg-[#0E1118] border border-[#3B82F6] flex items-center justify-center overflow-hidden">
                    <img src={icon} alt="Custom Icon" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-semibold text-[#60A5FA]">Custom Local Icon Selected</span>
                </div>
              )}

              {/* Filtered Icon Grid */}
              <div className="max-h-40 overflow-y-auto pr-1 space-y-3">
                {/* Apps */}
                {(iconCategory === 'all' || iconCategory === 'apps') && (
                  <div>
                    <div className="text-[10px] font-mono text-[#626D7E] uppercase mb-1.5">Applications</div>
                    <div className="flex flex-wrap gap-1.5">
                      {BRAND_ICONS.filter((b) => !iconSearch || b.toLowerCase().includes(iconSearch.toLowerCase())).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setIcon(brand)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
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
                  </div>
                )}

                {/* Websites */}
                {(iconCategory === 'all' || iconCategory === 'web') && (
                  <div>
                    <div className="text-[10px] font-mono text-[#626D7E] uppercase mb-1.5">Websites & Services</div>
                    <div className="flex flex-wrap gap-1.5">
                      {WEB_ICONS.filter((w) => !iconSearch || w.toLowerCase().includes(iconSearch.toLowerCase())).map((web) => (
                        <button
                          key={web}
                          type="button"
                          onClick={() => setIcon(web)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            icon === web
                              ? 'bg-[#397BFF]/20 border-[#397BFF] shadow-sm'
                              : 'bg-[#191E28] border-transparent hover:bg-[#252C39]'
                          }`}
                          title={web.toUpperCase()}
                        >
                          <IconRenderer name={web} size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Glyphs */}
                {(iconCategory === 'all' || iconCategory === 'system') && (
                  <div>
                    <div className="text-[10px] font-mono text-[#626D7E] uppercase mb-1.5">System Glyphs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {SYSTEM_ICONS.filter((s) => !iconSearch || s.toLowerCase().includes(iconSearch.toLowerCase())).map((sys) => (
                        <button
                          key={sys}
                          type="button"
                          onClick={() => setIcon(sys)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
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
                )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setOpenPath(val);
                    detectUrlIcon(val);
                  }}
                  className="w-full px-3 py-2 bg-[#08090C] border border-[#252C39] rounded-lg text-xs font-mono text-[#F4F6FA] focus:outline-none focus:border-[#397BFF]"
                  placeholder="e.g. https://youtube.com, https://github.com, steam://open/main, C:\Users"
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
        <div className="p-4 border-t border-[#1F2532] flex items-center justify-between bg-[#111520]">
          <button
            type="button"
            onClick={handleTest}
            className="py-2 px-3.5 rounded-lg text-xs font-bold text-[#3B82F6] bg-[#182030] hover:bg-[#202B42] border border-[#2B3A54] flex items-center gap-1.5 cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>Test Action</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="py-2 px-4 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 rounded-lg text-xs font-bold text-white bg-[#1D4ED8] hover:bg-[#2563EB] border border-[#3B82F6] flex items-center gap-1.5 cursor-pointer"
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
