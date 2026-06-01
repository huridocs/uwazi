import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';

type FilesToolbarProps = {
  totalCount: number;
  selectedCount: number;
  onAddFile: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

const FilesToolbar = ({
  totalCount,
  selectedCount,
  onAddFile,
  onSelectAll,
  onDeselectAll,
}: FilesToolbarProps) => (
  <div className="flex items-center gap-2 border-t border-border-soft p-3">
    <Button variant="ghost" onClick={onAddFile} className="inline-flex items-center gap-1">
      <PlusIcon className="h-4 w-4" />
      <Translate>Add file</Translate>
    </Button>
    <button type="button" className="text-xs text-ink-secondary hover:text-ink" onClick={onSelectAll}>
      <Translate>Select all</Translate>
    </button>
    <button
      type="button"
      className="text-xs text-ink-secondary hover:text-ink disabled:text-ink-muted"
      onClick={onDeselectAll}
      disabled={!selectedCount}
    >
      <Translate>Deselect all</Translate>
    </button>
    <span className="ml-auto text-xs text-ink-tertiary">
      {selectedCount} / {totalCount}
    </span>
  </div>
);

export { FilesToolbar };
