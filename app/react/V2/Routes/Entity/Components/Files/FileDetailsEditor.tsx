import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import {
  fileLanguageSelectOptions,
  fileSupportsLanguage,
  resolveFileLanguage,
} from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileDeleteAction } from './FileDeleteAction.js';
import { FileDetailsField } from './FileDetailsField.js';
import { FileDetailsCard } from './FileDetailsCard.js';
import { FileDetailsReadonlyMeta } from './FileDetailsReadonlyMeta.js';
import { FileDocumentContextBadge } from './FileDocumentContextBadge.js';
import { FileLanguageSelect } from './FileLanguageSelect.js';
import { EntityFileRow, FileEditFocus } from './types.js';

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
    <div className="space-y-3">
      <FileDetailsCard
        headerAction={
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
        }
      >
        <FileDetailsField label={<Translate>Name</Translate>}>
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
        </FileDetailsField>

        <div className="grid grid-cols-2 gap-3">
          {showLanguage ? (
            <FileDetailsField label={<Translate>Language</Translate>}>
              <FileLanguageSelect
                selectRef={languageSelectRef}
                id={`file-language-${row.raw._id}`}
                value={language}
                onChange={setLanguage}
                options={languageOptions}
                aria-label="File language"
              />
            </FileDetailsField>
          ) : null}
          <FileDetailsReadonlyMeta row={row} />
        </div>
      </FileDetailsCard>

      <FileDocumentContextBadge row={row} />
      <FileDeleteAction row={row} />
    </div>
  );
};

export { FileDetailsEditor };
