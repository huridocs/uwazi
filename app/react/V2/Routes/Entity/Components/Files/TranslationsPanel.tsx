import React from 'react';
import { EyeIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, Pill } from '#V2/Components/UI/index.js';
import { FileDropzone } from '#V2/Components/Forms/FileDropzone.js';
import { EntityFileRow } from './types.js';

const TranslationsPanel = ({
  focusedRow,
  primaryRows,
  onFocusRow,
  onDeleteRow,
  onUpload,
}: {
  focusedRow?: EntityFileRow;
  primaryRows: EntityFileRow[];
  onFocusRow: (row: EntityFileRow) => void;
  onDeleteRow: (row: EntityFileRow) => void;
  onUpload: (files: File[]) => Promise<void>;
}) => {
  if (!focusedRow) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>Select a file</Translate>
      </div>
    );
  }

  const translations = primaryRows;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-2 flex-grow flex-col space-y-2 overflow-auto">
        {translations.map(file => (
          <div
            key={file.rowId}
            className="flex items-center gap-2 rounded-md border border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] p-2"
          >
            <Pill className="text-[10px]">{file.languageKey}</Pill>
            <DocumentTextIcon className="h-4 w-4" />
            <div className="flex-grow">
              <div>
                <span className="text-xs truncate text-ink">{file.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-muted">{file.typeLabel}</span>
                <span className="text-[10px] text-ink-muted">{file.sizeLabel}</span>
              </div>
            </div>

            <a href={file.raw.url || (file.raw.filename ? `/api/files/${file.raw.filename}` : '')}>
              <Button variant="ghost" size="small" className="inline-flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <Translate className="sr-only">View</Translate>
              </Button>
            </a>
            <Button
              variant="dangerSubtle"
              size="small"
              onClick={() => onDeleteRow(file)}
              className="inline-flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              <Translate className="sr-only">Delete</Translate>
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] pt-3">
        <FileDropzone multiple={false} onChange={files => onUpload(files)} />
      </div>
    </div>
  );
};

export { TranslationsPanel };
