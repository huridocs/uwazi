import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { FileDownloadButton, fileDownloadUrl } from '../../Tabs/footers/FileDownloadButton.js';
import { FilePreviewView } from './FilePreviewView.js';
import type { EntityFileRow } from './types.js';

const FilePreviewModal = ({ row, onClose }: { row: EntityFileRow; onClose: () => void }) => {
  const url = fileDownloadUrl(row);
  return (
    <Modal size="xxxl" ariaLabel={row.displayName}>
      <Modal.Header>
        <h2 className="truncate text-sm font-bold text-ink">{row.displayName}</h2>
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
