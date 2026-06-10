import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { PDF } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { DocumentViewModeSelect } from '../../Components/DocumentViewModeSelect.js';
import { PlainText } from '../../Components/PlainText.js';
import { pdfController } from '../../Components/atoms.js';
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
    onPdfReady,
  } = useDocumentPdfView({ mainDocument, entity });

  const mainPdfController = useAtomValue(pdfController);
  const isMobile = useIsMobile();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  const [currentClusterPage, setCurrentClusterPage] = useState<number | null>(null);

  useEffect(() => {
    if (isRaw) {
      setPageHeight(undefined);
      return undefined;
    }

    const pageElement = document.querySelector<HTMLDivElement>(
      `.page[data-page-number="${pageNumber}"]`
    );

    if (!pageElement) {
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

  const onClusterClick = (markers: RelationshipMarker[]) => {
    const clusterPage = markers?.[0]?.anchor?.selections?.[0]?.page;
    if (!clusterPage) return;
    if (clusterPage !== currentClusterPage) {
      setCurrentClusterPage(clusterPage);
      mainPdfController?.goToPage(clusterPage);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
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
            onClusterClick={onClusterClick}
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
