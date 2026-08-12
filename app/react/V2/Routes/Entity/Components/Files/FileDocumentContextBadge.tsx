import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { AddTranslationButton } from './AddTranslationButton.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { fileFieldLabelClass } from './FileDetailsField.js';
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

const chipClass = (current: boolean) =>
  current
    ? 'flex items-center gap-1.5 rounded border border-ink/30 bg-parchment px-2 py-1 cursor-default'
    : 'flex items-center gap-1.5 rounded border border-border bg-paper px-2 py-1 hover:bg-parchment cursor-pointer';

const LanguageBadge = ({ code }: { code: string }) => (
  <span className="rounded bg-vellum px-1 text-nano font-semibold text-ink-secondary">{code}</span>
);

const FileDocumentContextBadge = ({ row }: { row: EntityFileRow }) => {
  const { mainDocumentId, primaryRows, setFocusedRowId } = useEntityFiles();
  const variant = resolveVariant(row, mainDocumentId);
  const isPrimary = row.category === 'primary';
  const showChips = isPrimary && primaryRows.length > 1;

  return (
    <div className="flex flex-col gap-3 rounded-md bg-warm p-4">
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
        <>
          {showChips ? (
            <div className="space-y-1.5">
              <p className={fileFieldLabelClass}>
                <Translate>Translations</Translate>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {primaryRows.map(translationRow => {
                  const current = translationRow.rowId === row.rowId;
                  if (current) {
                    return (
                      <span
                        key={translationRow.rowId}
                        aria-current="true"
                        className={chipClass(true)}
                      >
                        <LanguageBadge code={translationRow.languageKey} />
                        <span className="max-w-[180px] truncate text-xs text-ink">
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
                      className={chipClass(false)}
                    >
                      <LanguageBadge code={translationRow.languageKey} />
                      <span className="max-w-[180px] truncate text-xs text-ink">
                        {translationRow.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="flex items-center pt-1">
            <AddTranslationButton className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-micro font-medium text-ink-secondary transition-colors hover:text-ink" />
          </div>
        </>
      )}
    </div>
  );
};

export { FileDocumentContextBadge };
