import React from 'react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

type IconComponentType = React.ComponentType<{ size?: number; className?: string; color?: string }>;
const iconMap = LucideIcons as unknown as Record<string, IconComponentType>;

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  className = '',
  size = 20,
  color,
}) => {
  if (!name) {
    return <HelpCircle size={size} className={className} color={color} />;
  }

  // Find icon in Lucide namespace
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // If not found, attempt case-insensitive match
    const lowerName = name.toLowerCase();
    const matchedKey = Object.keys(iconMap).find(
      (k) => k.toLowerCase() === lowerName
    );
    if (matchedKey) {
      const MatchedIcon = iconMap[matchedKey];
      return <MatchedIcon size={size} className={className} color={color} />;
    }
    return <HelpCircle size={size} className={className} color={color} />;
  }

  return <IconComponent size={size} className={className} color={color} />;
};

export const POPULAR_ICONS: { category: string; icons: string[] }[] = [
  {
    category: 'System & Media',
    icons: [
      'Volume2',
      'Volume1',
      'VolumeX',
      'Play',
      'Pause',
      'SkipForward',
      'SkipBack',
      'Lock',
      'Power',
      'Mic',
      'MicOff',
      'Headphones',
      'Radio',
    ],
  },
  {
    category: 'Applications & Tools',
    icons: [
      'Calculator',
      'Terminal',
      'Code',
      'FileText',
      'FolderOpen',
      'Folder',
      'Camera',
      'Activity',
      'Sliders',
      'Settings',
      'Cpu',
      'HardDrive',
      'Monitor',
    ],
  },
  {
    category: 'Web & Navigation',
    icons: [
      'Globe',
      'Search',
      'ExternalLink',
      'Bookmark',
      'Share2',
      'CornerUpLeft',
      'ArrowRight',
      'Compass',
      'Cloud',
      'Mail',
      'Tv',
      'Video',
      'Music',
    ],
  },
  {
    category: 'Gaming & Streaming',
    icons: [
      'Gamepad2',
      'Crosshair',
      'Film',
      'Circle',
      'MessageSquare',
      'Bell',
      'Trophy',
      'Flame',
      'Zap',
      'Sparkles',
      'Sun',
      'Moon',
    ],
  },
  {
    category: 'Developer & Git',
    icons: [
      'GitBranch',
      'GitCommit',
      'ArrowUpCircle',
      'ArrowDownCircle',
      'Bug',
      'Terminal',
      'Layers',
      'Scissors',
      'Trash2',
      'Copy',
      'Clipboard',
    ],
  },
];
