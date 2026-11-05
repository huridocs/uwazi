import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { MobileBottomSheet } from '#V2/Components/Layouts/PaneLayout/MobileBottomSheet.js';
import { FILE_PREVIEW_SHEET_ORDER } from '#V2/Components/Layouts/PaneLayout/sheetStack.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { FileDownloadButton, fileDownloadUrl } from '../../Tabs/footers/FileDownloadButton.js';
import { fileFactsLine, fileRowShowsLanguage, fileShownName } from './fileHelpers.js';
import { FilePreviewView } from './FilePreviewView.js';
import type { EntityFileRow } from './types.js';

type FilePreviewProps = {
  row: EntityFileRow;
  onClose: () => void;
  url: string;
  facts: string;
};

const previewActions = (onClose: () => void, url: string) => (
  <>
    <Button variant="warm" onClick={onClose}>
      <Translate>Close</Translate>
    </Button>
    {url ? <FileDownloadButton href={url} /> : null}
  </>
);

const filePreviewSheet = ({ row, onClose, url, facts }: FilePreviewProps) => (
  <MobileBottomSheet
    open
    bare
    order={FILE_PREVIEW_SHEET_ORDER}
    ariaLabel={fileShownName(row)}
    defaultSnap="full"
    onClose={onClose}
  >
    {chrome => (
      <div className="flex h-full min-h-0 flex-col bg-(--color-theme-surface-raised)">
        <div
          className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex min-w-0 items-baseline gap-2">
            {chrome.back}
            <h2 dir="ltr" className="truncate text-sm font-semibold text-ink">
              {fileShownName(row)}
            </h2>
            {facts ? (
              <p dir="ltr" className="min-w-0 truncate text-meta text-ink-tertiary">
                {facts}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('System', 'Close', null, false)}
            className="inline-flex shrink-0 items-center rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <FilePreviewView row={row} />
        </div>
        <div
          className="flex h-12 shrink-0 items-center justify-end gap-2 px-3"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          {previewActions(onClose, url)}
        </div>
      </div>
    )}
  </MobileBottomSheet>
);

const FilePreviewModal = ({ row, onClose }: { row: EntityFileRow; onClose: () => void }) => {
  const url = fileDownloadUrl(row);
  const facts = fileFactsLine(row, fileRowShowsLanguage(row));
  if (useIsMobile()) return filePreviewSheet({ row, onClose, url, facts });
  return (
    <Modal size="xxxl" ariaLabel={row.displayName}>
      <Modal.Header>
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 dir="ltr" className="max-w-full shrink-0 truncate text-sm font-semibold text-ink">
            {fileShownName(row)}
          </h2>
          {facts ? (
            <p dir="ltr" className="min-w-0 truncate text-meta text-ink-tertiary">
              {facts}
            </p>
          ) : null}
        </div>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body className="min-h-96">
        <FilePreviewView row={row} />
      </Modal.Body>
      <Modal.Footer>{previewActions(onClose, url)}</Modal.Footer>
    </Modal>
  );
};

export { FilePreviewModal };
