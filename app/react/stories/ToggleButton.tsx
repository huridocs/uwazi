import React from 'react';

interface ToggleButtonProps {
  label: string | React.ReactNode;
  onToggle?: () => any;
  disabled?: boolean;
  value?: any;
}

const ToggleButton = ({ value, label, onToggle, disabled }: ToggleButtonProps) => {
  const checkedColor = disabled ? 'peer-checked:bg-teal-600' : 'peer-checked:bg-blue-600';
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        value={value}
        className="sr-only peer"
        disabled={disabled}
        onChange={onToggle}
        data-cy="toggle"
      />
      <div
        className={`${checkedColor} w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
      />
      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
    </label>
  );
};

export { ToggleButton };
