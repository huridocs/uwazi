// oxlint-disable react/jsx-pascal-case
import React from 'react';
import { PDF } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import {
  PlainText,
  DocumentViewModeSelect,
  DocumentSelectionFloatingMenu,
  DocumentLanguageFallbackNotice,
} from '#V2/Routes/Entity/Components/document/index.js';
import {
  useEntityLanguage,
  useEnsureAnchors,
  useDirectedRelationships,
  useDocumentPdf,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';
import { useDocumentPdfLayout } from '../hooks/useDocumentPdfLayout.js';

type DocumentTabProps = {
  entity: EntityType;
  mainDocument: FileType;
  pagePlaintext?: string;
  showViewModeSelect?: boolean;
  showRail?: boolean;
};

const DocumentTab = ({
  entity,
  mainDocument,
  pagePlaintext,
  showViewModeSelect = false,
  showRail = true,
}: DocumentTabProps) => {
  const relationships = useDirectedRelationships();
  const ensureAnchors = useEnsureAnchors();
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
    pdfSelectionMenuOpen,
    canWrite,
    handlePageChange,
    handleHighlightClick,
    handleRailHover,
    handleRailPointClick,
    handleClusterClick,
    handleClusterMoreClick,
    onPdfReady,
    propertySelectionHighlights,
  } = useDocumentPdfView({ mainDocument, entity });
  const { armedPdfFill, requestPdfFillCommit } = useDocumentPdf();
  const isMobile = useIsMobile();
  const { isRtl } = useEntityLanguage();
  const { pdfScrollRoot, setPdfScrollRoot, pageHeight, railInsetRight, handlePdfReady } =
    useDocumentPdfLayout({
      isRaw,
      pageNumber,
      showRail,
      documentId: mainDocument._id,
      ensureAnchors,
      onPdfReady,
    });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {showViewModeSelect ? (
        <div className="mb-1 flex shrink-0 justify-end">
          <DocumentViewModeSelect />
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DocumentLanguageFallbackNotice document={mainDocument} />
        <div className={`relative h-full min-h-0 rounded-md ${isRaw ? 'hidden' : 'block'}`}>
          <div
            ref={setPdfScrollRoot}
            data-testid="pdf-scroll-container"
            className={`absolute inset-0 overflow-y-auto pl-1 scrollbar-gutter-stable ${
              showRail ? 'pr-15' : ''
            }`}
          >
            <PDF
              key={mainDocument._id || filename}
              fileUrl={`/api/files/${filename}`}
              size={{ height: '100%', width: '100%' }}
              scrollRoot={pdfScrollRoot}
              onSelect={handleTextSelect}
              onDeselect={handleTextDeselect}
              onPageChange={handlePageChange}
              onHighlightClick={handleHighlightClick}
              onPdfReady={handlePdfReady}
              highlights={propertySelectionHighlights}
              initialPage={pageNumber}
            />
          </div>
          {!isMobile && (
            <RelationshipsDisplay
              selfSharedId={entity.sharedId}
              relationships={relationships}
              document={mainDocument}
              currentPage={pageNumber}
              pageHeight={pageHeight}
              railInsetRight={railInsetRight}
              showRail={showRail}
              activeRelationshipId={activeRelationshipId}
              onPointClick={handleRailPointClick}
              onPointHover={handleRailHover}
              onClusterClick={handleClusterClick}
              onClusterHover={handleRailHover}
              onMoreClick={handleClusterMoreClick}
            />
          )}
          {selectedText && pdfSelectionMenuOpen && canWrite && !isRaw ? (
            <DocumentSelectionFloatingMenu
              selection={selectedText}
              onCreateRelationship={() => handleCreateRelationship(selectedText)}
              onAddToToC={() => handleAddToToC(selectedText)}
              armedLabel={armedPdfFill?.label}
              onFillFromSelection={requestPdfFillCommit}
              scrollRoot={pdfScrollRoot}
            />
          ) : null}
        </div>
        <div className={`h-full min-h-0 overflow-auto ${isRaw ? 'block' : 'hidden'}`}>
          <PlainText
            text={pagePlaintext || ''}
            dir={isRtl ? 'rtl' : 'ltr'}
            page={isRaw ? pageNumber : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export { DocumentTab };
