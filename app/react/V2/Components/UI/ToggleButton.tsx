import React from 'react';

interface ToggleButtonProps {
  children: string | React.ReactNode;
  onToggle?: () => any;
  disabled?: boolean;
  value?: any;
  className?: string;
}

const ToggleButton = ({
  children,
  onToggle,
  value,
  disabled,
  className = '',
}: ToggleButtonProps) => {
  const checkedColor = disabled ? 'peer-checked:bg-primary-300' : 'peer-checked:bg-primary-600';
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        value={value}
        className={`${className} sr-only peer`}
        disabled={disabled}
        onChange={onToggle}
        data-testid="toggle"
      />
      <div
        className={`${checkedColor}  ${className} w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
      />
      {children}
    </label>
  );
};

export type { ToggleButtonProps };

export { ToggleButton };
