import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getAppIconComponent } from './icons/AppIcons';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  className = '',
  size = 18,
  color,
}) => {
  if (!name) {
    return <LucideIcons.Command size={size} className={className} style={color ? { color } : undefined} />;
  }

  // 1. Check if name is an image data URI or path (extracted Windows icon)
  if (name.startsWith('data:image/') || name.startsWith('http://') || name.startsWith('https://') || name.startsWith('asset://') || name.startsWith('/')) {
    return (
      <img
        src={name}
        alt="App Icon"
        width={size}
        height={size}
        className={`object-contain rounded-sm select-none pointer-events-none ${className}`}
      />
    );
  }

  // 2. Check if name is a known application brand
  const AppIcon = getAppIconComponent(name);
  if (AppIcon) {
    return <AppIcon size={size} className={className} />;
  }

  // 3. Lucide Icon lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideComp = (LucideIcons as any)[name];
  if (LucideComp) {
    return (
      <LucideComp
        size={size}
        className={className}
        style={color ? { color } : undefined}
        strokeWidth={2}
      />
    );
  }

  // 4. Default clean fallback glyph
  return (
    <LucideIcons.Command
      size={size}
      className={className}
      style={color ? { color } : undefined}
      strokeWidth={2}
    />
  );
};
