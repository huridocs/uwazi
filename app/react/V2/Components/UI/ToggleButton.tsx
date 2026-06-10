import React from 'react';

interface ToggleButtonProps {
  children: string | React.ReactNode;
  onToggle?: () => any;
  disabled?: boolean;
  checked?: boolean;
  value?: any;
  className?: string;
  size?: 'regular' | 'small';
}

const ToggleButton = ({
  children,
  onToggle,
  checked,
  value,
  disabled,
  className = '',
  size = 'regular',
}: ToggleButtonProps) => {
  const toggleVars = {
    ['--toggle-track-bg' as string]:
      'var(--color-theme-toggle-track-bg, var(--color-theme-control-border, #e5e7eb))',
    ['--toggle-track-active' as string]: disabled
      ? 'var(--color-theme-toggle-track-disabled-active-bg, var(--color-theme-bg-muted, #9ca3af))'
      : 'var(--color-theme-toggle-track-active-bg, var(--color-theme-action-primary, #2563eb))',
    ['--toggle-thumb-bg' as string]:
      'var(--color-theme-toggle-thumb-bg, var(--color-theme-surface-raised, #ffffff))',
    ['--toggle-thumb-border' as string]:
      'var(--color-theme-toggle-thumb-border, var(--color-theme-control-border, #d1d5db))',
  } as React.CSSProperties;

  const sizeClasses = {
    regular: {
      container: 'w-11 h-6',
      thumb: 'after:h-5 after:w-5 after:left-[2px] after:top-1/2 after:-translate-y-1/2',
    },
    small: {
      container: 'w-9 h-5',
      thumb: 'after:h-4 after:w-4 after:left-[2px] after:top-1/2 after:-translate-y-1/2',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <label
      className={`relative inline-flex items-center gap-2 ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        value={value}
        className="sr-only peer"
        disabled={disabled}
        checked={checked}
        onChange={onToggle}
        data-testid="toggle"
      />
      <div
        className={`${className} relative ${currentSize.container} rounded-full transition-colors bg-(--toggle-track-bg)
        peer-checked:bg-(--toggle-track-active) peer-checked:after:translate-x-full
        after:content-[''] after:absolute after:rounded-full after:border
        after:bg-(--toggle-thumb-bg) after:border-(--toggle-thumb-border)
        ${currentSize.thumb} after:transition-all`}
        style={toggleVars}
      />
      {children}
    </label>
  );
};

export type { ToggleButtonProps };

export { ToggleButton };
