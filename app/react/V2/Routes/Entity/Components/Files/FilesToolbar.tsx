import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, NeedAuthorization } from '#V2/Components/UI/index.js';

type FilesToolbarProps = {
  totalCount: number;
  selectedCount: number;
  onAddFile: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
};

const FilesToolbar = ({
  totalCount,
  selectedCount,
  onAddFile,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
}: FilesToolbarProps) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex w-full items-center gap-2">
      <Button variant="ghost" onClick={onAddFile} className="inline-flex items-center gap-1">
        <PlusIcon className="h-4 w-4" />
        <Translate>Add file</Translate>
      </Button>
      <button
        type="button"
        className="text-xs text-ink-secondary hover:text-ink"
        onClick={onSelectAll}
      >
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
      {hasSelection ? (
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-ink-tertiary">
            <Translate>Selected</Translate> {selectedCount} <Translate>of</Translate> {totalCount}
          </span>
          <NeedAuthorization roles={['admin', 'editor']}>
            <Button variant="danger" onClick={onDeleteSelected} data-testid="files-bulk-delete">
              <Translate>Delete</Translate>
            </Button>
          </NeedAuthorization>
        </div>
      ) : null}
    </div>
  );
};

export { FilesToolbar };
