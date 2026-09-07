import React, { useEffect } from 'react';
import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { LanguageSelect } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { FileLanguageChip } from './FileLanguageChip.js';
import { FileProcessStatusIndicator } from './FileProcessStatusIndicator.js';
import { FileThumbnail } from './FileThumbnail.js';
import { ViewFileButton } from './ViewFileButton.js';
import { isFileRowSelectable } from './fileHelpers.js';
import { useFileRowDraft } from './useFileRowDraft.js';
import { EntityFileRow } from './types.js';

const DrawerFileRow = ({
  row,
  active,
  editing,
  onView,
  onEdit,
  onCancelEdit,
  onCommit,
}: {
  row: EntityFileRow;
  active?: boolean;
  editing: boolean;
  onView: (row: EntityFileRow) => void;
  onEdit: (row: EntityFileRow) => void;
  onCancelEdit: () => void;
  onCommit: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
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

  useEffect(() => {
    if (!editing) return;
    resetDraft();
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [editing, row.displayName, row.raw.language, row.raw.originalname]);

  const save = async () => commit(onCommit, { trimName: true });

  return (
    <div
      className={`flex min-h-14.5 items-stretch overflow-hidden rounded-md border transition-colors ${
        active
          ? 'border-ink/30 bg-parchment hover:bg-parchment'
          : 'border-border/50 bg-paper hover:bg-warm/50'
      } ${row.status === 'processing' ? 'opacity-60' : ''}`}
    >
      <FileThumbnail kind={row.kind} />
      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
          <input
            ref={nameInputRef}
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                save().catch(() => undefined);
              }
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="w-full rounded border border-border bg-paper px-1.5 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-carbon/30"
            aria-label={t('System', 'Name', null, false)}
            disabled={saving}
          />
          <div className="flex items-center gap-2">
            {showLanguage ? (
              <LanguageSelect
                appearance="compact"
                value={draftLanguage}
                onChange={setDraftLanguage}
                options={languageOptions}
                aria-label={t('System', 'Language', null, false)}
                disabled={saving}
              />
            ) : null}
            <span className="text-nano text-ink-tertiary">{row.typeLabel.toUpperCase()}</span>
            <span dir="ltr" className="text-nano text-ink-tertiary">
              {row.sizeLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-medium text-ink">{row.displayName}</p>
            <FileProcessStatusIndicator status={row.status} />
            {row.languageKey !== '—' ? (
              <FileLanguageChip>{row.languageKey}</FileLanguageChip>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-nano text-ink-tertiary">{row.typeLabel.toUpperCase()}</span>
            <span dir="ltr" className="text-nano text-ink-tertiary">
              {row.sizeLabel}
            </span>
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1 pr-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => {
                save().catch(() => undefined);
              }}
              disabled={saving}
              aria-label={t('System', 'Save', null, false)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-warm text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:opacity-60"
            >
              <CheckIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={saving}
              aria-label={t('System', 'Cancel', null, false)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-warm hover:text-ink disabled:opacity-60"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            {isFileRowSelectable(row) ? (
              <EntityWriteAuthorization>
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  aria-label={t('System', 'Rename', null, false)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-warm hover:text-ink"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </EntityWriteAuthorization>
            ) : null}
            <ViewFileButton onClick={() => onView(row)} />
          </>
        )}
      </div>
    </div>
  );
};

export { DrawerFileRow };
