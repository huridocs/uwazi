import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { fileSupportsLanguage } from './fileUploadHelpers.js';
import { getRowIcon } from './filesTableColumns.js';
import { EntityFileRow } from './types.js';

const fieldLabelClass = 'text-nano font-medium uppercase tracking-wide text-ink-muted';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => {
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-md bg-warm p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>File details</Translate>
          </p>
          <EntityWriteAuthorization>
            <Button
              variant="compact"
              size="small"
              onClick={onEdit}
              className="inline-flex items-center gap-1"
            >
              <PencilIcon className="h-3 w-3" />
              <Translate>Edit</Translate>
            </Button>
          </EntityWriteAuthorization>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className={fieldLabelClass}>
              <Translate>Name</Translate>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink">
              {getRowIcon(row)}
              <span className="truncate">{row.displayName}</span>
            </div>
          </div>
          {showLanguage ? (
            <div>
              <div className={fieldLabelClass}>
                <Translate>Language</Translate>
              </div>
              <span className="inline-block rounded bg-vellum px-2 py-0.5 text-xs font-medium text-ink-secondary">
                {row.languageKey}
              </span>
            </div>
          ) : null}
          <div>
            <div className={fieldLabelClass}>
              <Translate>Type</Translate>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-ink">
              {getRowIcon(row)}
              <span>{row.typeLabel}</span>
            </div>
          </div>
          <div>
            <div className={fieldLabelClass}>
              <Translate>Size</Translate>
            </div>
            <div className="text-sm text-ink">{row.sizeLabel}</div>
          </div>
          <div>
            <div className={fieldLabelClass}>
              <Translate>Modified</Translate>
            </div>
            <div className="text-sm text-ink">{row.modifiedLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsView };
