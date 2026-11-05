import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownTrayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { Button, SelectControls } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';

type FilesToolbarProps = {
  totalCount: number;
  selectedCount: number;
  downloadCount: number;
  showBulkActions?: boolean;
  onAddFile: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
};

const FILES_ACTION_BAR_FOLD_BELOW = 480;

const foldFilesActionBar = (width: number) => width > 0 && width < FILES_ACTION_BAR_FOLD_BELOW;

const iconButtonClass =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors';

const useActionBarWidth = () => {
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const read = () => setWidth(bar.clientWidth);
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  return { barRef, folded: foldFilesActionBar(width) };
};

const FilesToolbar = ({
  totalCount,
  selectedCount,
  downloadCount,
  showBulkActions = true,
  onAddFile,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDownloadSelected,
}: FilesToolbarProps) => {
  const hasSelection = selectedCount > 0;
  const showSelectionActions = hasSelection && showBulkActions;
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const { barRef, folded } = useActionBarWidth();
  const showDownload = downloadCount > 0 && hasSelection;

  return (
    <div ref={barRef} className="flex w-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <EntityWriteAuthorization>
          {folded ? (
            <button
              type="button"
              aria-label={t('System', 'Add file', null, false)}
              onClick={onAddFile}
              className={`${iconButtonClass} bg-warm text-ink-secondary hover:bg-parchment hover:text-ink`}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Button variant="warm" onClick={onAddFile} className="inline-flex items-center gap-1.5">
              <span className="text-ink-tertiary">+</span>
              <Translate>Add file</Translate>
            </Button>
          )}
        </EntityWriteAuthorization>
        {folded ? (
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            disabled={totalCount === 0}
            className="cursor-pointer px-1 text-micro font-medium text-ink transition-colors hover:text-ink-secondary disabled:cursor-default disabled:text-ink-muted"
          >
            {allSelected ? <Translate>Deselect all</Translate> : <Translate>Select all</Translate>}
          </button>
        ) : (
          <SelectControls
            allSelected={allSelected}
            hasSelection={hasSelection}
            totalCount={totalCount}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        )}
        {folded && showSelectionActions ? (
          <span className="text-xs tabular-nums text-ink-secondary">
            {selectedCount} <Translate>of</Translate> {totalCount}
          </span>
        ) : null}
      </div>
      {showSelectionActions ? (
        <div className={`flex shrink-0 items-center ${folded ? 'gap-1' : 'gap-4'}`}>
          {folded ? null : (
            <span className="text-xs text-ink-secondary">
              <Translate>Selected</Translate> {selectedCount} <Translate>of</Translate> {totalCount}
            </span>
          )}
          {showDownload ? (
            <button
              type="button"
              data-testid="files-bulk-download"
              aria-label={
                folded
                  ? `${t('System', 'Download', null, false)} ${downloadCount} ${t('System', 'files', null, false)}`
                  : undefined
              }
              onClick={onDownloadSelected}
              className={
                folded
                  ? `${iconButtonClass} text-ink-secondary hover:bg-warm hover:text-ink`
                  : 'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-ink-secondary tabular-nums transition-colors hover:bg-warm hover:text-ink'
              }
            >
              {folded ? (
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              ) : (
                <>
                  <Translate>Download</Translate> {downloadCount}
                </>
              )}
            </button>
          ) : null}
          <EntityWriteAuthorization>
            {folded ? (
              <button
                type="button"
                aria-label={`${t('System', 'Delete', null, false)} ${selectedCount} ${t('System', 'files', null, false)}`}
                onClick={onDeleteSelected}
                data-testid="files-bulk-delete"
                className={`${iconButtonClass} text-seal hover:bg-seal-tint`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Button variant="danger" onClick={onDeleteSelected} data-testid="files-bulk-delete">
                <Translate>Delete</Translate>
              </Button>
            )}
          </EntityWriteAuthorization>
        </div>
      ) : null}
    </div>
  );
};

export { FilesToolbar, foldFilesActionBar };
