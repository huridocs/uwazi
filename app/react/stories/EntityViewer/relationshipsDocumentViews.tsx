import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PDF, type PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import {
  useDocumentPdf,
  useDocumentRelationshipNav,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipSelection } from '#V2/Routes/Entity/Components/document/index.js';
import { projectRelationshipMarkers } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { apiEntity, templates } from '../fixtures/referencesFixtures.js';
import { RelationshipsStoryProvider } from './RelationshipsStoryProvider.js';

const usePdfPageHeight = (currentPage: number) => {
  const [pageHeight, setPageHeight] = useState<number | undefined>();

  useEffect(() => {
    const pageElement = document.querySelector<HTMLDivElement>(
      `.page[data-page-number="${currentPage}"]`
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
  }, [currentPage]);

  return pageHeight;
};

type RelationshipsDocumentViewProps = {
  entity: Entity;
  mainDocument: FileType;
  fileUrl?: string;
  activeRelationshipId?: string | null;
  onPointClick?: (marker: RelationshipMarker) => void;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
  onPageChange?: (page: number) => void;
};

const RelationshipsDocumentView = ({
  entity,
  mainDocument,
  fileUrl = '/sample.pdf',
  activeRelationshipId = null,
  onPointClick,
  onClusterClick,
  onPageChange,
}: RelationshipsDocumentViewProps) => {
  const documentControls = useRef<PDFControls>();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentClusterPage, setCurrentClusterPage] = useState<number | null>(null);
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const pageHeight = usePdfPageHeight(currentPage);
  const isMobile = useIsMobile();

  const defaultOnPointClick = useCallback((marker: RelationshipMarker) => {
    const color = templates.find(t => t._id === marker.target.templateId)?.color;
    const highlight = relationshipToHighlight(marker.anchor, color);
    if (highlight) {
      documentControls.current?.toggleHighlights([highlight]);
    }
  }, []);

  const defaultOnClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
      const page = markers?.[0]?.anchor?.selections?.[0]?.page;
      if (!page) {
        documentControls.current?.toggleHighlights([]);
        return;
      }
      if (page !== currentClusterPage) {
        setCurrentClusterPage(page);
        documentControls.current?.goToPage(page);
      } else {
        documentControls.current?.toggleHighlights([]);
      }
    },
    [currentClusterPage]
  );

  return (
    <div
      data-testid="document-container"
      className="relative h-full min-h-0 rounded-md bg-(--color-theme-surface-warm)"
    >
      <div
        ref={setPdfScrollRoot}
        data-testid="pdf-scroll-container"
        className="absolute inset-0 overflow-y-auto"
      >
        <PDF
          fileUrl={fileUrl}
          size={{ height: '100%', width: '90%' }}
          scrollRoot={pdfScrollRoot}
          onPdfReady={controls => {
            documentControls.current = controls;
          }}
          onPageChange={page => {
            setCurrentPage(page);
            onPageChange?.(page);
          }}
        />
      </div>
      <RelationshipsDisplay
        entity={entity}
        document={mainDocument}
        currentPage={currentPage}
        pageHeight={pageHeight}
        showRail={!isMobile}
        activeRelationshipId={activeRelationshipId}
        onPointClick={marker => {
          onPointClick?.(marker);
          defaultOnPointClick(marker);
        }}
        onClusterClick={markers => {
          onClusterClick?.(markers);
          defaultOnClusterClick(markers);
        }}
      />
    </div>
  );
};

type RelationshipsSyncedDocumentViewProps = {
  entity: Entity;
  mainDocument: FileType;
  fileUrl?: string;
};

const RelationshipsSyncedDocumentView = ({
  entity,
  mainDocument,
  fileUrl = '/sample.pdf',
}: RelationshipsSyncedDocumentViewProps) => {
  const { setPdfController: setPDFControls, pdfController: mainPdfController } = useDocumentPdf();
  const { setScrollToRelationshipPanel } = useDocumentRelationshipNav();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useRelationshipSelection();
  const { activeClusterRefIds, setActiveClusterRefIds } = useRelationshipsPanelFacetFilters();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const pageHeight = usePdfPageHeight(currentPage);
  const isMobile = useIsMobile();

  useEffect(
    () => () => {
      setActiveClusterRefIds(null);
    },
    [entity.sharedId, setActiveClusterRefIds]
  );

  const handleClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
      if (markers.length === 0) return;
      const clusterPage = markers[0]?.anchor?.selections?.[0]?.page;
      if (!clusterPage) return;

      const ids = markers.map(marker => marker._id);
      const isSameCluster =
        activeClusterRefIds !== null &&
        activeClusterRefIds.length === ids.length &&
        ids.every(id => activeClusterRefIds.includes(id));

      if (isSameCluster) {
        setActiveClusterRefIds(null);
        clearRelationshipSelection();
        return;
      }

      setActiveClusterRefIds(ids);
      mainPdfController?.goToPage(clusterPage);
    },
    [activeClusterRefIds, clearRelationshipSelection, mainPdfController, setActiveClusterRefIds]
  );

  const handleHighlightClick = useCallback(
    (relationshipId: string) => {
      const marker = projectRelationshipMarkers(entity).find(item => item._id === relationshipId);
      if (marker) {
        selectRelationship(marker, { scrollPanel: true });
        return;
      }
      setScrollToRelationshipPanel(relationshipId);
      setExpandForRefId(relationshipId);
    },
    [entity, selectRelationship, setExpandForRefId, setScrollToRelationshipPanel]
  );

  return (
    <div
      data-testid="document-container"
      className="relative h-full min-h-0 rounded-md bg-(--color-theme-surface-warm)"
    >
      <div
        ref={setPdfScrollRoot}
        data-testid="pdf-scroll-container"
        className="absolute inset-0 overflow-y-auto"
      >
        <PDF
          fileUrl={fileUrl}
          size={{ height: '100%', width: '90%' }}
          scrollRoot={pdfScrollRoot}
          onPdfReady={setPDFControls}
          onPageChange={setCurrentPage}
          onHighlightClick={handleHighlightClick}
        />
      </div>
      {!isMobile && (
        <RelationshipsDisplay
          entity={entity}
          document={mainDocument}
          currentPage={currentPage}
          pageHeight={pageHeight}
          activeRelationshipId={activeRelationshipId}
          onPointClick={marker => selectRelationship(marker, { scrollPanel: true })}
          onClusterClick={handleClusterClick}
        />
      )}
    </div>
  );
};

type RelationshipsDocumentStoryProps = {
  locale: 'en' | 'es';
  fileUrl?: string;
  activeRelationshipId?: string | null;
  onPointClick?: (marker: RelationshipMarker) => void;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
};

const RelationshipsDocumentStory = ({
  locale,
  fileUrl = '/sample.pdf',
  activeRelationshipId = null,
  onPointClick,
  onClusterClick,
}: RelationshipsDocumentStoryProps) => {
  const mainDocument = apiEntity.documents![0];
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="h-screen max-h-200 bg-(--color-theme-surface-raised)">
      <BrowserRouter>
        <RelationshipsStoryProvider locale={locale} entity={apiEntity}>
          <div className="flex h-full w-full flex-col gap-(--spacing-theme-3) p-4 text-ink">
            <div>
              <Translate>Relationships</Translate>
              <p>
                <Translate>Current page</Translate>: {currentPage}
              </p>
            </div>
            <div className="relative min-h-0 flex-1">
              <RelationshipsDocumentView
                entity={apiEntity}
                mainDocument={mainDocument}
                fileUrl={fileUrl}
                activeRelationshipId={activeRelationshipId}
                onPointClick={onPointClick}
                onClusterClick={onClusterClick}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </RelationshipsStoryProvider>
      </BrowserRouter>
    </div>
  );
};

export { RelationshipsDocumentStory, RelationshipsDocumentView, RelationshipsSyncedDocumentView };
export type { RelationshipsDocumentStoryProps };
