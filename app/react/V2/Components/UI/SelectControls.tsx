import React from 'react';
import { Translate } from '#app/I18N/index.js';

type SelectControlsProps = {
  allSelected: boolean;
  hasSelection: boolean;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

const SelectControls = ({
  allSelected,
  hasSelection,
  totalCount,
  onSelectAll,
  onDeselectAll,
}: SelectControlsProps) => {
  const selectDisabled = totalCount === 0 || allSelected;
  const deselectDisabled = !hasSelection;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={`px-1 text-micro font-medium transition-colors ${
          selectDisabled
            ? 'cursor-default text-ink-muted'
            : 'cursor-pointer text-ink hover:text-ink-secondary'
        }`}
        onClick={onSelectAll}
        disabled={selectDisabled}
      >
        <Translate>Select all</Translate>
      </button>
      <button
        type="button"
        className={`px-1 text-micro font-medium transition-colors ${
          deselectDisabled
            ? 'cursor-default text-ink-muted'
            : 'cursor-pointer text-ink hover:text-ink-secondary'
        }`}
        onClick={onDeselectAll}
        disabled={deselectDisabled}
      >
        <Translate>Deselect all</Translate>
      </button>
    </div>
  );
};

export type { SelectControlsProps };
export { SelectControls };
