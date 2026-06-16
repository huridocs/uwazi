import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { Provider } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { PDF, PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { apiEntity, templates } from '../fixtures/referencesFixtures.js';
import { createRelationshipsStoryStore } from './createRelationshipsStoryStore.js';

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
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const pageNumber = currentPage.toString();
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
  }, [currentPage]);

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

  const handlePointClick = useCallback(
    (marker: RelationshipMarker) => {
      onPointClick?.(marker);
      defaultOnPointClick(marker);
    },
    [defaultOnPointClick, onPointClick]
  );

  const handleClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
      onClusterClick?.(markers);
      defaultOnClusterClick(markers);
    },
    [defaultOnClusterClick, onClusterClick]
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
        onPointClick={handlePointClick}
        onClusterClick={handleClusterClick}
      />
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

const RelationshipsDocumentStoryBody = ({
  fileUrl,
  activeRelationshipId,
  onPointClick,
  onClusterClick,
  mainDocument,
}: Omit<RelationshipsDocumentStoryProps, 'locale'> & { mainDocument: FileType }) => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
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
  );
};

const RelationshipsDocumentStory = ({
  locale,
  fileUrl = '/sample.pdf',
  activeRelationshipId = null,
  onPointClick,
  onClusterClick,
}: RelationshipsDocumentStoryProps) => {
  const store = createRelationshipsStoryStore(locale);
  const mainDocument = apiEntity.documents![0];

  return (
    <div className="h-screen max-h-200 bg-(--color-theme-surface-raised)">
      <BrowserRouter>
        <Provider tore={store}>
          <RelationshipsDocumentStoryBody
            fileUrl={fileUrl}
            activeRelationshipId={activeRelationshipId}
            onPointClick={onPointClick}
            onClusterClick={onClusterClick}
            mainDocument={mainDocument}
          />
        </Provider>
      </BrowserRouter>
    </div>
  );
};

export { RelationshipsDocumentStory, RelationshipsDocumentView };
export type { RelationshipsDocumentStoryProps };
