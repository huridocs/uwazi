/* eslint-disable react/no-multi-comp */
import React, { useCallback } from 'react';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileProcessStatusIndicator } from './FileProcessStatusIndicator.js';
import { isFileRowSelectable } from './fileHelpers.js';
import { EntityFileRow, FileKind } from './types.js';

const SectionHeader = ({ label }: { label: string }) => (
  <h3 className="mb-3 px-1 text-nano font-semibold uppercase tracking-wider text-ink-tertiary">
    <Translate>{label}</Translate>
  </h3>
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
  onView,
  onEdit,
}: {
  row: EntityFileRow;
  active?: boolean;
  onView: (row: EntityFileRow) => void;
  onEdit: (row: EntityFileRow) => void;
}) => (
  <div
    className={`flex min-h-14.5 items-stretch overflow-hidden rounded-md border transition-colors ${
      active
        ? 'border-ink/30 bg-parchment hover:bg-parchment'
        : 'border-border/50 bg-paper hover:bg-warm/50'
    } ${row.status === 'processing' ? 'opacity-60' : ''}`}
  >
    <FileThumbnail kind={row.kind} />
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
    <div className="flex shrink-0 items-center gap-1 pr-2">
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
    </div>
  </div>
);

const DrawerFilesList = () => {
  const {
    primaryRows,
    supportingRows,
    mainDocumentId,
    navigateToFilesSideTab,
    openFilePreviewForRow,
    openFileEdit,
  } = useEntityFiles();

  const onView = useCallback(
    (row: EntityFileRow) => {
      openFilePreviewForRow(row.rowId);
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFilePreviewForRow]
  );

  const onEdit = useCallback(
    (row: EntityFileRow) => {
      openFileEdit(row.rowId, 'name');
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFileEdit]
  );

  const primaryCountLabel =
    primaryRows.length === 1
      ? `${primaryRows.length} ${t('System', 'file', null, false)}`
      : `${primaryRows.length} ${t('System', 'files', null, false)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 pb-8">
        <SectionHeader label="Primary documents" />
        {primaryRows.length === 0 ? (
          <p className="mb-5 px-1 text-xs italic text-ink-tertiary">
            <Translate>No primary documents</Translate>
          </p>
        ) : (
          <section className="mb-6">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h4 className="truncate text-sm font-semibold text-ink">
                <Translate>Documents</Translate>
              </h4>
              <span className="shrink-0 text-nano tabular-nums text-ink-tertiary">
                {primaryCountLabel}
              </span>
            </div>
            <div className="space-y-2">
              {primaryRows.map(row => (
                <DrawerFileRow
                  key={row.rowId}
                  row={row}
                  active={row.rowId === mainDocumentId}
                  onView={onView}
                  onEdit={onEdit}
                />
              ))}
            </div>
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
              <DrawerFileRow key={row.rowId} row={row} onView={onView} onEdit={onEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { DrawerFilesList };
