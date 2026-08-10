import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Pill } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
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
  const { mainDocumentId, primaryRows, setFocusedRowId, requestAddFile } = useEntityFiles();
  const variant = resolveVariant(row, mainDocumentId);
  const isPrimary = row.category === 'primary';

  return (
    <div className="flex flex-col gap-2 rounded-md bg-warm p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
          <Translate>Document</Translate>
        </span>
        <span className={`rounded px-1.5 py-0.5 text-nano font-medium ${badgeClass[variant]}`}>
          {variant === 'active' && <Translate>Active primary</Translate>}
          {variant === 'primary' && <Translate>Primary</Translate>}
          {variant === 'supporting' && <Translate>Supporting</Translate>}
        </span>
      </div>
      {isPrimary && (
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryRows.length > 1 &&
            primaryRows.map(translationRow => {
              if (translationRow.rowId === row.rowId) {
                return (
                  <span
                    key={translationRow.rowId}
                    className="flex items-center gap-1.5 rounded-md border border-border-soft bg-paper px-2 py-1"
                  >
                    <Pill className="text-nano">{translationRow.languageKey}</Pill>
                    <span className="max-w-24 truncate text-xs text-ink">
                      {translationRow.displayName}
                    </span>
                  </span>
                );
              }
              return (
                <button
                  key={translationRow.rowId}
                  type="button"
                  onClick={() => setFocusedRowId(translationRow.rowId)}
                  className="flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 hover:border-border-soft hover:bg-paper"
                >
                  <Pill className="text-nano">{translationRow.languageKey}</Pill>
                  <span className="max-w-24 truncate text-xs text-ink-secondary">
                    {translationRow.displayName}
                  </span>
                </button>
              );
            })}
          <EntityWriteAuthorization>
            <button
              type="button"
              onClick={() => requestAddFile('translation')}
              className="ml-auto flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-micro font-medium text-ink-secondary transition-colors hover:bg-paper hover:text-ink"
            >
              <PlusIcon className="h-3 w-3" />
              <Translate>Add translation</Translate>
            </button>
          </EntityWriteAuthorization>
        </div>
      )}
    </div>
  );
};

export { FileDocumentContextBadge };
