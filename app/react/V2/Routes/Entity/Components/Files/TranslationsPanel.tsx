import React from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileLanguageChip } from './FileLanguageChip.js';
import { EntityFileRow } from './types.js';

const TranslationsPanel = ({
  focusedRow,
  primaryRows,
  onFocusRow,
  onViewRow,
  onDeleteRow,
}: {
  focusedRow?: EntityFileRow;
  primaryRows: EntityFileRow[];
  onFocusRow: (row: EntityFileRow) => void;
  onViewRow: (row: EntityFileRow) => void;
  onDeleteRow: (row: EntityFileRow) => void;
}) => {
  if (!focusedRow) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>Select a file</Translate>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto">
      {primaryRows.map(file => (
        <div
          key={file.rowId}
          className="flex items-center gap-2 rounded-md border border-border/50 bg-paper px-3 py-2 transition-colors hover:bg-warm"
        >
          <button
            type="button"
            onClick={() => onFocusRow(file)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-start"
          >
            <FileLanguageChip>{file.languageKey}</FileLanguageChip>
            <span className="shrink-0">{getRowIcon(file)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{file.displayName}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-nano text-ink-muted">{file.typeLabel.toUpperCase()}</span>
                <span className="text-nano text-ink-muted">{file.sizeLabel}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onViewRow(file)}
            aria-label={`View ${file.displayName}`}
            className="rounded p-1 text-ink-tertiary transition-colors hover:bg-parchment"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            <Translate className="sr-only">View</Translate>
          </button>
          <EntityWriteAuthorization>
            <button
              type="button"
              onClick={() => onDeleteRow(file)}
              aria-label={`Delete ${file.displayName}`}
              className="rounded p-1 text-ink-muted transition-colors hover:bg-seal-tint hover:text-seal"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              <Translate className="sr-only">Delete</Translate>
            </button>
          </EntityWriteAuthorization>
        </div>
      ))}
    </div>
  );
};

export { TranslationsPanel };
