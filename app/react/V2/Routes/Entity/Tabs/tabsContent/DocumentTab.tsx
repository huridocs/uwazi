// oxlint-disable react/jsx-pascal-case
import React, { useEffect, useState } from 'react';
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
import { useDocumentPageHeight } from '../hooks/useDocumentPageHeight.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';
import { useRailInset } from '../hooks/useRailInset.js';

type DocumentTabProps = {
  entity: EntityType;
  mainDocument: FileType;
  pagePlaintext?: string;
  showViewModeSelect?: boolean;
  showRail?: boolean;
};

const useEnsureDocumentAnchors = (
  documentId: string | undefined,
  showRail: boolean,
  isRaw: boolean
) => {
  const ensureAnchors = useEnsureAnchors();
  useEffect(() => {
    if (!documentId || !showRail || isRaw) return;
    ensureAnchors().catch(() => undefined);
  }, [documentId, ensureAnchors, isRaw, showRail]);
};

const usePdfScrollRail = (showRail: boolean, isRaw: boolean) => {
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const { railInsetRight, measureRailInset } = useRailInset(pdfScrollRoot, !isRaw && showRail);
  return { pdfScrollRoot, setPdfScrollRoot, railInsetRight, measureRailInset };
};

const DocumentTab = ({
  entity,
  mainDocument,
  pagePlaintext,
  showViewModeSelect = false,
  showRail = true,
}: DocumentTabProps) => {
  const relationships = useDirectedRelationships();
  const view = useDocumentPdfView({ mainDocument, entity });
  const { armedPdfFill, requestPdfFillCommit } = useDocumentPdf();
  const isMobile = useIsMobile();
  const { isRtl } = useEntityLanguage();
  const { pdfScrollRoot, setPdfScrollRoot, railInsetRight, measureRailInset } = usePdfScrollRail(
    showRail,
    view.isRaw
  );
  useEnsureDocumentAnchors(mainDocument._id, showRail, view.isRaw);
  const pageHeight = useDocumentPageHeight(view.isRaw, view.pageNumber);
  const { selectedText } = view;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {showViewModeSelect ? (
        <div className="mb-1 flex shrink-0 justify-end">
          <DocumentViewModeSelect />
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DocumentLanguageFallbackNotice document={mainDocument} />
        <div className={`relative h-full min-h-0 rounded-md ${view.isRaw ? 'hidden' : 'block'}`}>
          <div
            ref={setPdfScrollRoot}
            data-testid="pdf-scroll-container"
            className={`absolute inset-0 overflow-y-auto pl-1 scrollbar-gutter-stable ${
              showRail ? 'pr-15' : ''
            }`}
          >
            <PDF
              key={mainDocument._id || view.filename}
              fileUrl={`/api/files/${view.filename}`}
              size={{ height: '100%', width: '100%' }}
              scrollRoot={pdfScrollRoot}
              onSelect={view.handleTextSelect}
              onDeselect={view.handleTextDeselect}
              onPageChange={view.handlePageChange}
              onHighlightClick={view.handleHighlightClick}
              onPdfReady={controls => {
                view.onPdfReady(controls);
                measureRailInset();
              }}
              highlights={view.propertySelectionHighlights}
              initialPage={view.pageNumber}
            />
          </div>
          {!isMobile && (
            <RelationshipsDisplay
              selfSharedId={entity.sharedId}
              relationships={relationships}
              document={mainDocument}
              currentPage={view.pageNumber}
              pageHeight={pageHeight}
              railInsetRight={railInsetRight}
              showRail={showRail}
              activeRelationshipId={view.activeRelationshipId}
              onPointClick={view.handleRailPointClick}
              onPointHover={view.handleRailHover}
              onClusterClick={view.handleClusterClick}
              onClusterHover={view.handleRailHover}
              onMoreClick={view.handleClusterMoreClick}
            />
          )}
          {selectedText && view.pdfSelectionMenuOpen && view.userIsAdminOrEditor && !view.isRaw ? (
            <DocumentSelectionFloatingMenu
              selection={selectedText}
              onCreateRelationship={() => view.handleCreateRelationship(selectedText)}
              onAddToToC={() => view.handleAddToToC(selectedText)}
              armedLabel={armedPdfFill?.label}
              onFillFromSelection={requestPdfFillCommit}
              scrollRoot={pdfScrollRoot}
            />
          ) : null}
        </div>
        <div className={`h-full min-h-0 overflow-auto ${view.isRaw ? 'block' : 'hidden'}`}>
          <PlainText
            text={pagePlaintext || ''}
            dir={isRtl ? 'rtl' : 'ltr'}
            page={view.isRaw ? view.pageNumber : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export { DocumentTab };
