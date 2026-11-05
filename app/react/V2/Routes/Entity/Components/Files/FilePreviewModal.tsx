import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { FileDownloadButton, fileDownloadUrl } from '../../Tabs/footers/FileDownloadButton.js';
import { fileFactsLine, fileRowShowsLanguage, fileShownName } from './fileHelpers.js';
import { FilePreviewView } from './FilePreviewView.js';
import type { EntityFileRow } from './types.js';

const FilePreviewModal = ({ row, onClose }: { row: EntityFileRow; onClose: () => void }) => {
  const url = fileDownloadUrl(row);
  const facts = fileFactsLine(row, fileRowShowsLanguage(row));
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
      <Modal.Footer>
        <Button variant="warm" onClick={onClose}>
          <Translate>Close</Translate>
        </Button>
        {url ? <FileDownloadButton href={url} /> : null}
      </Modal.Footer>
    </Modal>
  );
};

export { FilePreviewModal };
