import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { fileSupportsLanguage } from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => {
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  return (
    <div className="space-y-3 rounded-md bg-warm p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
          <Translate>File details</Translate>
        </h4>
        <EntityWriteAuthorization>
          <button
            type="button"
            onClick={onEdit}
            className="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-micro font-medium text-ink-secondary transition-colors hover:bg-paper hover:text-ink"
          >
            <PencilIcon className="h-micro w-micro text-ink-tertiary" />
            <Translate>Edit</Translate>
          </button>
        </EntityWriteAuthorization>
      </div>

      <div className="min-w-0 space-y-1">
        <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
          <Translate>Name</Translate>
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 px-2 py-1.5">
            {getRowIcon(row)}
            <span className="truncate text-sm text-ink">{row.displayName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {showLanguage ? (
          <div className="min-w-0 space-y-1">
            <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
              <Translate>Language</Translate>
            </span>
            <div className="min-w-0">
              <span className="inline-block rounded bg-vellum px-2 py-0.5 text-xs font-medium text-ink-secondary">
                {row.languageKey}
              </span>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Type</Translate>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-ink-secondary">
              {getRowIcon(row)}
              <span>{row.typeLabel}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Size</Translate>
          </span>
          <div className="min-w-0">
            <span className="text-sm text-ink-secondary">{row.sizeLabel}</span>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Modified</Translate>
          </span>
          <div className="min-w-0">
            <span className="text-sm text-ink-secondary">{row.modifiedLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsView };
