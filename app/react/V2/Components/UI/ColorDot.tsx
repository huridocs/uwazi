import React from 'react';

type ColorDotSize = 'sm' | 'md' | 'chip';

type ColorDotProps = {
  color: string;
  size?: ColorDotSize;
  ring?: boolean;
};

const sizeClasses: Record<ColorDotSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  chip: 'h-[0.4375rem] w-[0.4375rem]',
};

const ColorDot = ({ color, size = 'sm', ring = false }: ColorDotProps) => (
  <span
    className={`${sizeClasses[size]} shrink-0 rounded-[2px] ${
      ring ? 'ring-1 ring-inset ring-ink/20' : ''
    }`}
    style={{ backgroundColor: color }}
    aria-hidden
  />
);

export { ColorDot };
