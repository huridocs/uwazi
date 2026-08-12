import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileDetailsField } from './FileDetailsField.js';
import { EntityFileRow } from './types.js';

const FileDetailsCard = ({
  headerAction,
  children,
}: {
  headerAction: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-3 rounded-md bg-warm p-4">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>File details</Translate>
      </div>
      {headerAction}
    </div>
    {children}
  </div>
);

const FileDetailsReadonlyMeta = ({ row }: { row: EntityFileRow }) => (
  <>
    <FileDetailsField label={<Translate>Type</Translate>}>
      <div className="flex h-7 items-center gap-1.5 text-sm text-ink-secondary">
        {getRowIcon(row)}
        <span>{row.typeLabel}</span>
      </div>
    </FileDetailsField>
    <FileDetailsField label={<Translate>Size</Translate>}>
      <span className="text-sm text-ink-secondary">{row.sizeLabel}</span>
    </FileDetailsField>
    <FileDetailsField label={<Translate>Modified</Translate>}>
      <span className="text-sm text-ink-secondary">{row.modifiedLabel}</span>
    </FileDetailsField>
  </>
);

export { FileDetailsCard, FileDetailsReadonlyMeta };
