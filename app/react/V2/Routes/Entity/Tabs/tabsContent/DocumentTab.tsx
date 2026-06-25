import React, { useCallback, useEffect, useState } from 'react';
import { PDF, type PDFControls } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import {
  PlainText,
  DocumentViewModeSelect,
  DocumentSelectionFloatingMenu,
} from '#V2/Routes/Entity/Components/document/index.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';

const RAIL_WIDTH = 32;

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
    handleCreateRelationship,
    handleAddToToC,
    selectedText,
    userIsAdminOrEditor,
    handlePageChange,
    handleHighlightClick,
    handleRailPointClick,
    handleClusterClick,
    handleClusterMoreClick,
    onPdfReady,
  } = useDocumentPdfView({ mainDocument, entity });

  const isMobile = useIsMobile();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  const [railInsetRight, setRailInsetRight] = useState<number | undefined>();

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

  const measureRailInset = useCallback(() => {
    const container = pdfScrollRoot?.querySelector<HTMLElement>('#pdf-container');
    if (!pdfScrollRoot || !container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width <= 0) {
      return;
    }
    const gutter = pdfScrollRoot.getBoundingClientRect().right - containerRect.right;
    setRailInsetRight(Math.max(0, Math.round(gutter / 2 - RAIL_WIDTH / 2)));
  }, [pdfScrollRoot]);

  useEffect(() => {
    if (isRaw || !pdfScrollRoot) {
      return undefined;
    }
    measureRailInset();
    const observer = new ResizeObserver(measureRailInset);
    observer.observe(pdfScrollRoot);
    return () => {
      observer.disconnect();
    };
  }, [isRaw, pdfScrollRoot, measureRailInset]);

  const handlePdfReady = useCallback(
    (controls: PDFControls) => {
      onPdfReady(controls);
      measureRailInset();
    },
    [onPdfReady, measureRailInset]
  );

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
          className="absolute inset-0 overflow-y-auto pl-1 pr-[60px] [scrollbar-gutter:stable]"
        >
          <PDF
            fileUrl={`/api/files/${filename}`}
            size={{ height: '100%', width: '100%' }}
            scrollRoot={pdfScrollRoot}
            onSelect={handleTextSelect}
            onDeselect={handleTextDeselect}
            onPageChange={handlePageChange}
            onHighlightClick={handleHighlightClick}
            onPdfReady={handlePdfReady}
          />
        </div>
        {!isMobile && (
          <RelationshipsDisplay
            entity={entity}
            document={mainDocument}
            currentPage={pageNumber}
            pageHeight={pageHeight}
            railInsetRight={railInsetRight}
            activeRelationshipId={activeRelationshipId}
            onPointClick={handleRailPointClick}
            onClusterClick={handleClusterClick}
            onMoreClick={handleClusterMoreClick}
          />
        )}
        {selectedText && userIsAdminOrEditor && !isRaw ? (
          <DocumentSelectionFloatingMenu
            selection={selectedText}
            onCreateRelationship={() => handleCreateRelationship(selectedText)}
            onAddToToC={() => handleAddToToC(selectedText)}
          />
        ) : null}
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
