import React, { useEffect, useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { availableLanguages, LanguageUtils } from '#shared/language/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';

const resolveFileLanguage = (rawLanguage?: string) => {
  if (!rawLanguage) {
    return 'other';
  }

  if (rawLanguage === 'other') {
    return 'other';
  }

  const known = LanguageUtils.fromISO639_3(rawLanguage, false);
  return known?.ISO639_3 ?? 'other';
};

const FileDetailsEditor = ({
  row,
  onSave,
}: {
  row: EntityFileRow;
  onSave: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
}) => {
  const [originalname, setOriginalname] = useState(row.raw.originalname || row.displayName);
  const resolvedLanguage = useMemo(
    () => resolveFileLanguage(row.raw.language),
    [row.raw.language]
  );
  const [language, setLanguage] = useState(resolvedLanguage);

  useEffect(() => {
    setLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  return (
    <div className="rounded-md border border-border-soft bg-warm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>File details</Translate>
        </h3>
        <Button
          variant="primary"
          size="small"
          onClick={async () =>
            row.raw._id
              ? onSave({
                  _id: row.raw._id,
                  originalname,
                  language: language || undefined,
                })
              : Promise.resolve()
          }
          className="inline-flex items-center gap-1"
        >
          <CheckIcon className="h-4 w-4" />
          <Translate>Done</Translate>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label
            htmlFor={`file-name-${row.raw._id}`}
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-tertiary"
          >
            <Translate>Name</Translate>
          </label>
          <input
            id={`file-name-${row.raw._id}`}
            type="text"
            value={originalname}
            onChange={event => setOriginalname(event.target.value)}
            className="w-full rounded-md border border-border-soft bg-paper px-3 py-2 text-sm text-ink focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]"
          />
        </div>
        <div>
          <label
            htmlFor={`file-language-${row.raw._id}`}
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-tertiary"
          >
            <Translate>Language</Translate>
          </label>
          <select
            id={`file-language-${row.raw._id}`}
            value={language}
            onChange={event => setLanguage(event.target.value)}
            className="w-full rounded-md border border-border-soft bg-paper px-2 py-1 text-sm text-ink focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]"
          >
            {availableLanguages.map(item => (
              <option key={item.ISO639_3} value={item.ISO639_3}>
                {item.localized_label} ({item.label})
              </option>
            ))}
            <option value="other">{t('System', 'other', 'other', false)}</option>
          </select>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Type</Translate>
          </div>
          <div className="text-sm text-ink">{row.typeLabel}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Size</Translate>
          </div>
          <div className="text-sm text-ink">{row.sizeLabel}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Modified</Translate>
          </div>
          <div className="text-sm text-ink">{row.modifiedLabel}</div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsEditor };
