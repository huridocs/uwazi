import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';

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
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const selectDisabled = totalCount === 0 || allSelected;
  const deselectDisabled = !hasSelection;

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <EntityWriteAuthorization>
          <Button variant="warm" onClick={onAddFile} className="inline-flex items-center gap-1.5">
            <span className="text-ink-tertiary">+</span>
            <Translate>Add file</Translate>
          </Button>
        </EntityWriteAuthorization>
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
      </div>
      {hasSelection ? (
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-secondary">
            <Translate>Selected</Translate> {selectedCount} <Translate>of</Translate> {totalCount}
          </span>
          {selectedCount > 0 ? (
            <EntityWriteAuthorization>
              <Button variant="danger" onClick={onDeleteSelected} data-testid="files-bulk-delete">
                <Translate>Delete</Translate>
              </Button>
            </EntityWriteAuthorization>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export { FilesToolbar };
