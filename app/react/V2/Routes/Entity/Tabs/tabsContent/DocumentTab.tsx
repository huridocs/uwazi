import React from 'react';
import { PDF } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { DocumentViewModeSelect } from '../../Components/DocumentViewModeSelect.js';
import { PlainText } from '../../Components/PlainText.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';

type DocumentTabProps = {
  mainDocument: FileType;
  pagePlaintext?: string;
  showViewModeSelect?: boolean;
};

const DocumentTab = ({
  mainDocument,
  pagePlaintext,
  showViewModeSelect = false,
}: DocumentTabProps) => {
  const { filename, isRaw, handleTextSelect, handleTextDeselect, handlePageChange, onPdfReady } =
    useDocumentPdfView({ mainDocument });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {showViewModeSelect ? (
        <div className="mb-1 flex shrink-0 justify-end">
          <DocumentViewModeSelect />
        </div>
      ) : null}
      <div className={`min-h-0 flex-1 rounded-md ${isRaw ? 'hidden' : 'block'}`}>
        <PDF
          fileUrl={`/api/files/${filename}`}
          size={{ height: '100%', width: '90%' }}
          onSelect={handleTextSelect}
          onDeselect={handleTextDeselect}
          onPageChange={handlePageChange}
          onPdfReady={onPdfReady}
          className=""
        />
      </div>
      <div
        className={`min-h-0 flex-1 overflow-auto rounded-md bg-warm ${isRaw ? 'block' : 'hidden'}`}
      >
        <PlainText text={pagePlaintext || ''} />
      </div>
    </div>
  );
};

export { DocumentTab };
