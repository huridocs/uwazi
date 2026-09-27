import React from 'react';
import { ToggleButton } from '#V2/Components/UI/ToggleButton.js';

type WordSelectionToggleProps = {
  checked: boolean;
  onToggle: () => void;
};

const WordSelectionToggle = ({ checked, onToggle }: WordSelectionToggleProps) => (
  <div className="flex w-full justify-end">
    <ToggleButton checked={checked} onToggle={onToggle} size="small">
      Word selection
    </ToggleButton>
  </div>
);

export type { WordSelectionToggleProps };
export { WordSelectionToggle };
