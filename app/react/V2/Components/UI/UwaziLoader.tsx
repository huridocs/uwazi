import React from 'react';

type UwaziLoaderSize = 'xs' | 'sm' | 'md' | 'lg';
type UwaziLoaderColor = 'default' | 'white' | 'muted' | 'carbon' | 'seal' | 'warning';

type UwaziLoaderProps = {
  size?: UwaziLoaderSize;
  color?: UwaziLoaderColor;
  /** When false, renders the static brand mark (no sweep). Default true. */
  animate?: boolean;
  className?: string;
};

const sizes: Record<UwaziLoaderSize, { cell: number; gap: number }> = {
  xs: { cell: 4, gap: 1 },
  sm: { cell: 6, gap: 2 },
  md: { cell: 10, gap: 3 },
  lg: { cell: 16, gap: 4 },
};

const colors: Record<UwaziLoaderColor, string> = {
  default: 'var(--color-theme-text-primary, #1a1a1a)',
  white: '#ffffff',
  muted: 'var(--color-theme-text-muted, #6b7280)',
  carbon: 'var(--color-theme-action-primary, #2563eb)',
  seal: 'var(--color-theme-feedback-danger, #dc2626)',
  warning: 'var(--color-theme-feedback-warning, #d97706)',
};

const UwaziLoader = ({
  size = 'md',
  color = 'default',
  animate = true,
  className = '',
}: UwaziLoaderProps) => {
  const { cell, gap } = sizes[size];
  const backgroundColor = colors[color];

  return (
    <div
      className={`inline-grid align-middle ${className}`.trim()}
      style={{
        gridTemplateColumns: `repeat(3, ${cell}px)`,
        gridTemplateRows: `repeat(2, ${cell}px)`,
        gap,
      }}
      role={animate ? 'status' : undefined}
      aria-label={animate ? 'Loading' : undefined}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={animate ? 'uwazi-loader-cell rounded-[1px]' : 'rounded-[1px]'}
          style={{
            width: cell,
            height: cell,
            backgroundColor,
          }}
        />
      ))}
    </div>
  );
};

export { UwaziLoader };
export type { UwaziLoaderProps, UwaziLoaderColor, UwaziLoaderSize };
