import React from 'react';

interface ToggleButtonProps {
  children: string | React.ReactNode;
  onToggle?: () => any;
  disabled?: boolean;
  value?: any;
  className?: string;
  size?: 'regular' | 'small';
}

const ToggleButton = ({
  children,
  onToggle,
  value,
  disabled,
  className = '',
  size = 'regular',
}: ToggleButtonProps) => {
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
    <label className="relative inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        value={value}
        className={`${className} sr-only peer`}
        disabled={disabled}
        onChange={onToggle}
        data-testid="toggle"
      />
      <div
        className={`${className} ${currentSize.container} rounded-full peer
        peer-checked:[background-color:var(--toggle-track-active)] peer-checked:after:translate-x-full
        after:content-[''] after:absolute after:rounded-full after:border
        after:[background-color:var(--toggle-thumb-bg)] after:[border-color:var(--toggle-thumb-border)]
        ${currentSize.thumb} after:transition-all`}
        style={
          {
            backgroundColor: 'var(--color-theme-toggle-track-bg)',
            ['--toggle-track-active' as string]: disabled
              ? 'var(--color-theme-toggle-track-disabled-active-bg)'
              : 'var(--color-theme-toggle-track-active-bg)',
            ['--toggle-thumb-bg' as string]: 'var(--color-theme-toggle-thumb-bg)',
            ['--toggle-thumb-border' as string]: 'var(--color-theme-toggle-thumb-border)',
          } as React.CSSProperties
        }
      />
      {children}
    </label>
  );
};

export type { ToggleButtonProps };

export { ToggleButton };
