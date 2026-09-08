import React, { useEffect, useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { LanguageSelect } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileDeleteAction } from './FileDeleteAction.js';
import { FileDetailsField } from './FileDetailsField.js';
import { FileDetailsCard } from './FileDetailsCard.js';
import { FileDetailsReadonlyMeta } from './FileDetailsReadonlyMeta.js';
import { FileDocumentContextBadge } from './FileDocumentContextBadge.js';
import { useFileRowDraft } from './useFileRowDraft.js';
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
  const {
    draftName,
    setDraftName,
    draftLanguage,
    setDraftLanguage,
    saving,
    nameInputRef,
    languageOptions,
    showLanguage,
    resetDraft,
    commit,
  } = useFileRowDraft(row);
  const languageSelectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    resetDraft();
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

  return (
    <div className="space-y-3">
      <FileDetailsCard
        headerAction={
          <EntityWriteAuthorization>
            <button
              type="button"
              onClick={() => {
                commit(onSave).catch(() => undefined);
              }}
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
              value={draftName}
              onChange={event => setDraftName(event.target.value)}
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
              <LanguageSelect
                triggerRef={languageSelectRef}
                id={`file-language-${row.raw._id}`}
                value={draftLanguage}
                onChange={setDraftLanguage}
                options={languageOptions}
                aria-label="File language"
                appearance="default"
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
