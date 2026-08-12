/* eslint-disable react/no-multi-comp */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, EyeIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { AddTranslationButton } from './AddTranslationButton.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileLanguageSelect } from './FileLanguageSelect.js';
import { FileProcessStatusIndicator } from './FileProcessStatusIndicator.js';
import {
  fileLanguageSelectOptions,
  fileSupportsLanguage,
  isFileRowSelectable,
  resolveFileLanguage,
} from './fileHelpers.js';
import { EntityFileRow, FileKind } from './types.js';

const SectionHeader = ({ label }: { label: string }) => (
  <div className="mb-3 px-1 text-nano font-semibold uppercase tracking-wider text-ink-tertiary">
    <Translate>{label}</Translate>
  </div>
);

const thumbnailChipLabel = (kind: FileKind) => {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'image') return 'IMG';
  return 'DOC';
};

const FileThumbnail = ({ kind }: { kind: FileKind }) => {
  const wrap = 'flex w-16 shrink-0 items-center justify-center self-stretch rounded-l-md';

  if (kind === 'link') {
    return (
      <div className={`${wrap} bg-seal`}>
        <span className="text-tiny font-bold text-white">
          <Translate>Link</Translate>
        </span>
      </div>
    );
  }

  if (kind === 'audio' || kind === 'video') {
    return (
      <div className={`${wrap} bg-warm`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-parchment shadow-sm">
          <div className="ml-0.5 h-0 w-0 border-y-4 border-l-arrow border-y-transparent border-l-ink" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${wrap} bg-warm`}>
      <div className="flex h-11 w-9 items-center justify-center rounded bg-paper shadow-sm">
        <span className="text-pico text-ink-muted">{thumbnailChipLabel(kind)}</span>
      </div>
    </div>
  );
};

const ViewFileButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={t('System', 'View', null, false)}
    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-warm px-2.5 py-1 text-micro font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
  >
    <EyeIcon className="h-nano w-nano text-ink-tertiary" />
    <Translate>View</Translate>
  </button>
);

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
  const [draftName, setDraftName] = useState(row.raw.originalname || row.displayName);
  const [draftLanguage, setDraftLanguage] = useState(() => resolveFileLanguage(row.raw.language));
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const languageOptions = useMemo(() => fileLanguageSelectOptions(), []);
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  useEffect(() => {
    if (!editing) return;
    setDraftName(row.raw.originalname || row.displayName);
    setDraftLanguage(resolveFileLanguage(row.raw.language));
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [editing, row.displayName, row.raw.language, row.raw.originalname]);

  const save = async () => {
    if (!row.raw._id || saving) return;
    setSaving(true);
    try {
      await onCommit({
        _id: row.raw._id,
        originalname: draftName.trim() || row.displayName,
        language: showLanguage ? draftLanguage || undefined : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

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
              if (e.key === 'Enter') void save();
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="w-full rounded border border-border bg-paper px-1.5 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-carbon/30"
            aria-label={t('System', 'Name', null, false)}
            disabled={saving}
          />
          <div className="flex items-center gap-2">
            {showLanguage ? (
              <FileLanguageSelect
                compact
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
              <span className="shrink-0 rounded bg-vellum px-1 py-px text-tiny font-semibold text-ink-secondary">
                {row.languageKey}
              </span>
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
              onClick={() => void save()}
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

const DrawerFilesList = () => {
  const {
    primaryRows,
    supportingRows,
    mainDocumentId,
    navigateToFilesSideTab,
    openFilePreviewForRow,
    saveRow,
  } = useEntityFiles();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const onView = useCallback(
    (row: EntityFileRow) => {
      openFilePreviewForRow(row.rowId);
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFilePreviewForRow]
  );

  const onEdit = useCallback((row: EntityFileRow) => {
    setEditingRowId(row.rowId);
  }, []);

  const onCancelEdit = useCallback(() => {
    setEditingRowId(null);
  }, []);

  const onCommit = useCallback(
    async (payload: { _id: string; originalname: string; language?: string }) => {
      await saveRow(payload);
      setEditingRowId(null);
    },
    [saveRow]
  );

  const primaryCountLabel =
    primaryRows.length === 1
      ? `${primaryRows.length} ${t('System', 'file', null, false)}`
      : `${primaryRows.length} ${t('System', 'files', null, false)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 pb-8">

        <div className="mb-2 flex items-baseline justify-between px-1">
        <SectionHeader label="Primary documents" />
              <span className="shrink-0 text-nano tabular-nums text-ink-tertiary">
                {primaryCountLabel}
              </span>
        </div>
        {primaryRows.length === 0 ? (
          <p className="mb-5 px-1 text-xs italic text-ink-tertiary">
            <Translate>No primary documents</Translate>
          </p>
        ) : (
          <section className="mb-6">
            <div className="space-y-2">
              {primaryRows.map(row => (
                <DrawerFileRow
                  key={row.rowId}
                  row={row}
                  active={row.rowId === mainDocumentId}
                  editing={editingRowId === row.rowId}
                  onView={onView}
                  onEdit={onEdit}
                  onCancelEdit={onCancelEdit}
                  onCommit={onCommit}
                />
              ))}
            </div>
            <AddTranslationButton />
          </section>
        )}

        <SectionHeader label="Supporting files" />
        {supportingRows.length === 0 ? (
          <p className="px-1 text-xs italic text-ink-tertiary">
            <Translate>No supporting files yet. Add a file to get started.</Translate>
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {supportingRows.map(row => (
              <DrawerFileRow
                key={row.rowId}
                row={row}
                editing={editingRowId === row.rowId}
                onView={onView}
                onEdit={onEdit}
                onCancelEdit={onCancelEdit}
                onCommit={onCommit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { DrawerFilesList };
