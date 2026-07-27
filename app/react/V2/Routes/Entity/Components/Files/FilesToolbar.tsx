import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, SelectControls } from '#V2/Components/UI/index.js';
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

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <EntityWriteAuthorization>
          <Button variant="warm" onClick={onAddFile} className="inline-flex items-center gap-1.5">
            <span className="text-ink-tertiary">+</span>
            <Translate>Add file</Translate>
          </Button>
        </EntityWriteAuthorization>
        <SelectControls
          allSelected={allSelected}
          hasSelection={hasSelection}
          totalCount={totalCount}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
        />
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
