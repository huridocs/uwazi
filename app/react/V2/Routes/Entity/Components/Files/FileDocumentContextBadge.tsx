import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { EntityFileRow } from './types.js';

type BadgeVariant = 'active' | 'primary' | 'supporting';

const badgeClass: Record<BadgeVariant, string> = {
  active: 'bg-ink text-parchment',
  primary: 'bg-warning-light text-warning',
  supporting: 'bg-vellum text-ink-secondary',
};

const resolveVariant = (row: EntityFileRow, mainDocumentId?: string): BadgeVariant => {
  if (row.category === 'supporting') return 'supporting';
  return row.raw._id === mainDocumentId ? 'active' : 'primary';
};

const FileDocumentContextBadge = ({ row }: { row: EntityFileRow }) => {
  const { mainDocumentId } = useEntityFiles();
  const variant = resolveVariant(row, mainDocumentId);

  return (
    <div className="flex items-center justify-between rounded-md bg-warm p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>Document</Translate>
      </span>
      <span className={`rounded px-1.5 py-0.5 text-nano font-medium ${badgeClass[variant]}`}>
        {variant === 'active' && <Translate>Active primary</Translate>}
        {variant === 'primary' && <Translate>Primary</Translate>}
        {variant === 'supporting' && <Translate>Supporting</Translate>}
      </span>
    </div>
  );
};

export { FileDocumentContextBadge };
