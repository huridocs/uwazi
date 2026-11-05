import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { AddTranslationButton } from './AddTranslationButton.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileDetailsField } from './FileDetailsField.js';
import { EntityFileRow } from './types.js';

const badgeClass = {
  primary: 'bg-warning-light text-ink',
  supporting: 'bg-vellum text-ink-secondary',
};

const chipClass = (current: boolean) =>
  current
    ? 'flex cursor-default items-center gap-1.5 rounded border border-ink/30 bg-parchment px-2 py-1'
    : 'flex cursor-pointer items-center gap-1.5 rounded border border-border bg-paper px-2 py-1 hover:bg-parchment';

const FileDocumentContextBadge = ({ row }: { row: EntityFileRow }) => {
  const { primaryRows, setFocusedRowId, entity } = useEntityFiles();
  const isPrimary = row.category === 'primary';
  const variant = isPrimary ? 'primary' : 'supporting';
  const translations = isPrimary && primaryRows.length > 1 ? primaryRows : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
          <Translate>Document</Translate>
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-meta font-medium leading-normal ${badgeClass[variant]}`}
        >
          {isPrimary ? <Translate>Primary</Translate> : <Translate>Supporting</Translate>}
        </span>
      </div>
      {entity.title || translations.length > 0 ? (
        <div className="flex flex-col gap-3">
          {entity.title ? (
            <FileDetailsField label={<Translate>Title</Translate>}>
              <span className="text-sm font-normal leading-relaxed text-ink">{entity.title}</span>
            </FileDetailsField>
          ) : null}
          {translations.length > 0 ? (
            <FileDetailsField label={<Translate>Translations</Translate>}>
              <div className="flex flex-wrap gap-1.5">
                {translations.map(translationRow => {
                  const current = translationRow.rowId === row.rowId;
                  const body = (
                    <>
                      <span className="rounded bg-vellum px-1 text-meta font-semibold text-ink-secondary">
                        {translationRow.languageKey}
                      </span>
                      <span className="max-w-[180px] truncate text-xs text-ink">
                        {translationRow.displayName}
                      </span>
                    </>
                  );
                  if (current) {
                    return (
                      <span
                        key={translationRow.rowId}
                        aria-current="true"
                        className={chipClass(true)}
                      >
                        {body}
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
                      {body}
                    </button>
                  );
                })}
              </div>
            </FileDetailsField>
          ) : null}
        </div>
      ) : null}
      {isPrimary ? (
        <div className="flex items-center pt-1">
          <AddTranslationButton
            showIcon={false}
            className="ml-auto inline-flex cursor-pointer items-center text-meta font-medium leading-normal text-ink-secondary transition-colors hover:text-ink"
          />
        </div>
      ) : null}
    </div>
  );
};

export { FileDocumentContextBadge };
