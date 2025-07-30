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
  const checkedColor = disabled ? 'peer-checked:bg-primary-300' : 'peer-checked:bg-primary-600';

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
        className={`${checkedColor} ${className} ${currentSize.container} bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
        peer-checked:after:border-white after:content-[''] after:absolute
        after:bg-white after:border-gray-300 after:border after:rounded-full ${currentSize.thumb} after:transition-all`}
      />
      {children}
    </label>
  );
};

export type { ToggleButtonProps };

export { ToggleButton };
