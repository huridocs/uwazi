import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { fileSupportsLanguage } from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileDeleteAction } from './FileDeleteAction.js';
import { FileDetailsField } from './FileDetailsField.js';
import { FileDetailsCard, FileDetailsReadonlyMeta } from './FileDetailsShared.js';
import { FileDocumentContextBadge } from './FileDocumentContextBadge.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => {
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  return (
    <div className="space-y-3">
      <FileDetailsCard
        headerAction={
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
        }
      >
        <FileDetailsField label={<Translate>Name</Translate>}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            {getRowIcon(row)}
            <span className="truncate text-sm text-ink">{row.displayName}</span>
          </div>
        </FileDetailsField>

        <div className="grid grid-cols-2 gap-3">
          {showLanguage ? (
            <FileDetailsField label={<Translate>Language</Translate>}>
              <div className="flex h-7 items-center">
                <span className="inline-block rounded bg-vellum px-2 py-0.5 text-xs font-medium text-ink-secondary">
                  {row.languageKey}
                </span>
              </div>
            </FileDetailsField>
          ) : null}
          <FileDetailsReadonlyMeta row={row} />
        </div>
      </FileDetailsCard>

      <FileDocumentContextBadge row={row} />
      <FileDeleteAction row={row} />
    </div>
  );
};

export { FileDetailsView };
