import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { fileLanguageSelectOptions, fileSupportsLanguage } from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import { EntityFileRow, FileEditFocus } from './types.js';

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
  focusField = 'name',
}: {
  row: EntityFileRow;
  onSave: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
  focusField?: FileEditFocus;
}) => {
  const [originalname, setOriginalname] = useState(row.raw.originalname || row.displayName);
  const [language, setLanguage] = useState(() => resolveFileLanguage(row.raw.language));
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const languageSelectRef = useRef<HTMLSelectElement>(null);

  const languageOptions = useMemo(() => fileLanguageSelectOptions(), []);
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  useEffect(() => {
    setOriginalname(row.raw.originalname || row.displayName);
    setLanguage(resolveFileLanguage(row.raw.language));
    // Reset draft only when switching rows; keep in-progress edits across unrelated row prop churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional rowId-only reset
  }, [row.rowId]);

  useEffect(() => {
    if (focusField === 'language' && showLanguage) {
      languageSelectRef.current?.focus();
      return;
    }
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [focusField, row.rowId, showLanguage]);

  const handleDone = async () => {
    if (!row.raw._id || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        _id: row.raw._id,
        originalname,
        language: showLanguage ? language || undefined : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md bg-warm p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
          <Translate>File details</Translate>
        </div>
        <EntityWriteAuthorization>
          <button
            type="button"
            onClick={handleDone}
            disabled={saving}
            className="flex cursor-pointer items-center gap-1 rounded bg-ink px-2 py-0.5 text-micro font-medium text-parchment transition-colors hover:bg-ink/90 disabled:opacity-60"
          >
            <CheckIcon className="h-micro w-micro" />
            <Translate>Done</Translate>
          </button>
        </EntityWriteAuthorization>
      </div>

      <div className="min-w-0 space-y-1">
        <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
          <Translate>Name</Translate>
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded border border-border bg-paper focus-within:ring-1 focus-within:ring-carbon/30">
            <span className="ml-2 shrink-0">{getRowIcon(row)}</span>
            <input
              ref={nameInputRef}
              id={`file-name-${row.raw._id}`}
              type="text"
              value={originalname}
              onChange={event => setOriginalname(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-ink focus:outline-none"
              aria-label="File name"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {showLanguage ? (
          <div className="min-w-0 space-y-1">
            <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
              <Translate>Language</Translate>
            </span>
            <div className="min-w-0">
              <div className="relative flex w-full min-w-0 items-center overflow-hidden rounded border border-border bg-paper focus-within:ring-1 focus-within:ring-carbon/30">
                <select
                  ref={languageSelectRef}
                  id={`file-language-${row.raw._id}`}
                  value={language}
                  onChange={event => setLanguage(event.target.value)}
                  className="w-full min-w-0 max-w-full cursor-pointer appearance-none bg-transparent py-0.5 pl-2 pr-6 text-xs font-medium text-ink focus:outline-none"
                  aria-label="File language"
                >
                  {languageOptions.map(option => (
                    <option key={option.key ?? option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 h-micro w-micro text-ink-tertiary" />
              </div>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Type</Translate>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-ink-secondary">
              {getRowIcon(row)}
              <span>{row.typeLabel}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Size</Translate>
          </span>
          <div className="min-w-0">
            <span className="text-sm text-ink-secondary">{row.sizeLabel}</span>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">
            <Translate>Modified</Translate>
          </span>
          <div className="min-w-0">
            <span className="text-sm text-ink-secondary">{row.modifiedLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsEditor };
