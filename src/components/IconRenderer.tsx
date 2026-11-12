import React from 'react';
import * as Icons from 'lucide-react';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.CircleDot;

  return (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : undefined}
    />
  );
};
