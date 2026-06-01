import React from 'react';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, NeedAuthorization, Pill } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({
  row,
  onEdit,
  onDelete,
}: {
  row: EntityFileRow;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const fileUrl = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');

  return (
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

      <div className="mt-3 rounded-md border border-border-soft p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Document</Translate>
          </span>
          <Pill color="gray">{row.category === 'primary' ? 'Primary' : 'Supporting'}</Pill>
        </div>
        <NeedAuthorization roles={['admin', 'editor']}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => undefined} className="inline-flex items-center gap-1">
              <ArrowUpCircleIcon className="h-4 w-4" />
              <Translate>Promote to primary</Translate>
            </Button>
            <Button
              variant="dangerSubtle"
              onClick={onDelete}
              className="inline-flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              <Translate>Delete file</Translate>
            </Button>
          </div>
        </NeedAuthorization>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border-soft pt-3">
        <a href={fileUrl} className="inline-flex">
          <Button variant="ghost" className="inline-flex items-center gap-1">
            <EyeIcon className="h-4 w-4" />
            <Translate>View</Translate>
          </Button>
        </a>
        <a href={row.raw.filename ? `${fileUrl}?download=true` : fileUrl} className="inline-flex">
          <Button variant="ghost" className="inline-flex items-center gap-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <Translate>Download</Translate>
          </Button>
        </a>
      </div>
    </div>
  );
};

export { FileDetailsView };
