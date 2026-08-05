import React from 'react';

type ColorDotSize = 'sm' | 'md';

type ColorDotProps = {
  color: string;
  size?: ColorDotSize;
};

const sizeClasses: Record<ColorDotSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

const ColorDot = ({ color, size = 'sm' }: ColorDotProps) => (
  <span
    className={`${sizeClasses[size]} shrink-0 rounded-[2px]`}
    style={{ backgroundColor: color }}
    aria-hidden
  />
);

export { ColorDot };
