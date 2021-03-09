import React from 'react';

export interface ToggleButtonProps {
  checked: boolean;
  onClick: () => void;
}
export const ToggleButton = ({ checked, onClick }: ToggleButtonProps) => (
  <label className="toggleButton">
    <input type="checkbox" checked={checked} onChange={onClick} />
    <span className="slider" />
  </label>
);
