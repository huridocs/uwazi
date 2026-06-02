import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => (
  <div className="flex h-full flex-col">
    <div className="rounded-md border border-border-soft bg-warm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>File details</Translate>
        </h3>
        <Button variant="compact" onClick={onEdit}>
          <Translate>Edit</Translate>
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <dt className="text-xs text-ink-tertiary">NAME</dt>
          <dd className="text-sm text-ink">{row.displayName}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">LANGUAGE</dt>
          <dd className="text-sm text-ink">{row.languageKey}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">TYPE</dt>
          <dd className="text-sm text-ink">{row.typeLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">SIZE</dt>
          <dd className="text-sm text-ink">{row.sizeLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">MODIFIED</dt>
          <dd className="text-sm text-ink">{row.modifiedLabel}</dd>
        </div>
      </dl>
    </div>
  </div>
);

export { FileDetailsView };
