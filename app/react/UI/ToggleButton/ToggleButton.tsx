import React from 'react';

export interface ToggleButtonProps {
  checked: boolean;
  onClick: () => void;
}
export const ToggleButton = ({ checked, onClick }: ToggleButtonProps) => (
  <input type="checkbox" checked={checked} onClick={onClick} className="toggle-button" />
);
