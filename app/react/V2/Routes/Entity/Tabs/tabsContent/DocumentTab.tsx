import React, { useEffect, useState } from 'react';
import { PDF } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { DocumentViewModeSelect } from '../../Components/document/DocumentViewModeSelect.js';
import { PlainText } from '../../Components/document/PlainText.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';

type DocumentTabProps = {
  entity: EntityType;
  mainDocument: FileType;
  pagePlaintext?: string;
  showViewModeSelect?: boolean;
};

const DocumentTab = ({
  entity,
  mainDocument,
  pagePlaintext,
  showViewModeSelect = false,
}: DocumentTabProps) => {
  const {
    filename,
    isRaw,
    pageNumber,
    activeRelationshipId,
    handleTextSelect,
    handleTextDeselect,
    handlePageChange,
    handleHighlightClick,
    handleRailPointClick,
    handleClusterClick,
    onPdfReady,
  } = useDocumentPdfView({ mainDocument, entity });

  const isMobile = useIsMobile();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState<number | undefined>();

  useEffect(() => {
    if (isRaw) {
      setPageHeight(undefined);
      return undefined;
    }

    const pageElement = document.querySelector<HTMLDivElement>(
      `.page[data-page-number="${pageNumber}"]`
    );

    if (!pageElement) {
      // Warn users in case the way pages are represented changes since it will interfere with calculation for marker positions in page view.
      // eslint-disable-next-line no-console
      console.warn('Page element could not be found');
      setPageHeight(undefined);
      return undefined;
    }

    const updateHeight = () => {
      const { height } = pageElement.getBoundingClientRect();
      setPageHeight(height > 0 ? height : undefined);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(pageElement);

    return () => {
      observer.disconnect();
    };
  }, [isRaw, pageNumber]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {showViewModeSelect ? (
        <div className="mb-1 flex shrink-0 justify-end">
          <DocumentViewModeSelect />
        </div>
      ) : null}
      <div className={`relative min-h-0 flex-1 rounded-md ${isRaw ? 'hidden' : 'block'}`}>
        <div
          ref={setPdfScrollRoot}
          data-testid="pdf-scroll-container"
          className="absolute inset-0 overflow-y-auto"
        >
          <PDF
            fileUrl={`/api/files/${filename}`}
            size={{ height: '100%', width: '90%' }}
            scrollRoot={pdfScrollRoot}
            onSelect={handleTextSelect}
            onDeselect={handleTextDeselect}
            onPageChange={handlePageChange}
            onHighlightClick={handleHighlightClick}
            onPdfReady={onPdfReady}
          />
        </div>
        {!isMobile && (
          <RelationshipsDisplay
            entity={entity}
            document={mainDocument}
            currentPage={pageNumber}
            pageHeight={pageHeight}
            activeRelationshipId={activeRelationshipId}
            onPointClick={handleRailPointClick}
            onClusterClick={handleClusterClick}
          />
        )}
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
