import React, { useCallback, useEffect, useState } from 'react';
import { PDF, type PDFControls } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import {
  useDocumentInteraction,
  useRelationshipsPanelFilters,
} from '#V2/Routes/Entity/Components/EntityScopedProvider.js';
import { useRelationshipSelection } from '#V2/Routes/Entity/Components/useRelationshipSelection.js';

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
  const {
    setPdfController: setPDFControls,
    pdfController: mainPdfController,
    setScrollToRelationshipPanel,
  } = useDocumentInteraction();
  const { activeRelationshipId, selectRelationship } = useRelationshipSelection();
  const { activeClusterRefIds, setActiveClusterRefIds, setExpandForRefId } =
    useRelationshipsPanelFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

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

  useEffect(
    () => () => {
      setActiveClusterRefIds(null);
    },
    [entity.sharedId, setActiveClusterRefIds]
  );

  const handleRailPointClick = useCallback(
    (marker: RelationshipMarker) => {
      selectRelationship(marker, { scrollPanel: true });
    },
    [selectRelationship]
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
        return;
      }

      setActiveClusterRefIds(ids);
      mainPdfController?.goToPage(clusterPage);
    },
    [activeClusterRefIds, mainPdfController, setActiveClusterRefIds]
  );

  const handleHighlightClick = useCallback(
    (relationshipId: string) => {
      setScrollToRelationshipPanel(relationshipId);
      setExpandForRefId(relationshipId);
    },
    [setExpandForRefId, setScrollToRelationshipPanel]
  );

  const onPdfReady = useCallback(
    (controls: PDFControls) => {
      setPDFControls(controls);
    },
    [setPDFControls]
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
          onPdfReady={onPdfReady}
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
          onPointClick={handleRailPointClick}
          onClusterClick={handleClusterClick}
        />
      )}
    </div>
  );
};

export { RelationshipsSyncedDocumentView };
