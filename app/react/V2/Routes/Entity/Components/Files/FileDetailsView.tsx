import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { fileSupportsLanguage } from './fileUploadHelpers.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => {
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-md border border-border-soft bg-warm p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-micro font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>File details</Translate>
          </p>
          <Button variant="compact" onClick={onEdit}>
            <Translate>Edit</Translate>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="text-xs text-ink-tertiary">
              <Translate>Name</Translate>
            </div>
            <div className="text-sm font-medium text-ink">{row.displayName}</div>
          </div>
          {showLanguage ? (
            <div>
              <div className="text-xs text-ink-tertiary">
                <Translate>Language</Translate>
              </div>
              <div className="text-sm font-medium text-ink">{row.languageKey}</div>
            </div>
          ) : null}
          <div>
            <div className="text-xs text-ink-tertiary">
              <Translate>Type</Translate>
            </div>
            <div className="text-sm font-medium text-ink">{row.typeLabel}</div>
          </div>
          <div>
            <div className="text-xs text-ink-tertiary">
              <Translate>Size</Translate>
            </div>
            <div className="text-sm font-medium text-ink">{row.sizeLabel}</div>
          </div>
          <div>
            <div className="text-xs text-ink-tertiary">
              <Translate>Modified</Translate>
            </div>
            <div className="text-sm font-medium text-ink">{row.modifiedLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsView };
