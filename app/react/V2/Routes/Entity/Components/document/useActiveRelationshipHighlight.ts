import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  filterMarkersForDocument,
  projectRelationshipMarkers,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  useDirectedRelationships,
  useDocumentPdf,
  useDocumentRelationshipNav,
  useEnsureResolved,
  useEntityLanguage,
  useEntityScopedEntity,
  useRelationshipQueryStatus,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';
import {
  activateRelationshipSelection,
  clearRelationshipPdfHighlights,
  deselectActiveRelationship,
  syncActiveRelationshipHighlight,
  type RelationshipHighlightActions,
} from './relationshipHighlightUtils.js';

const usePdfControllerRef = (mainPdfController: PDFControls | null) => {
  const pdfControllerRef = useRef(mainPdfController);
  pdfControllerRef.current = mainPdfController;
  return pdfControllerRef;
};

const useSelectedMarkerRef = () => {
  const selectedMarkerRef = useRef<RelationshipMarker | null>(null);
  const setSelectedMarker = useCallback((marker: RelationshipMarker | null) => {
    selectedMarkerRef.current = marker;
  }, []);
  const getSelectedMarker = useCallback(() => selectedMarkerRef.current, []);
  return { getSelectedMarker, setSelectedMarker };
};

const useRelationshipLiveMarkers = () => {
  const relationships = useDirectedRelationships();
  const entity = useEntityScopedEntity();
  const { mainDocument } = useEntityLanguage();
  const templates = useAtomValue(templatesAtom);

  const liveMarkers = useMemo(
    () =>
      filterMarkersForDocument(
        projectRelationshipMarkers(entity.sharedId, relationships),
        mainDocument?._id,
        entity.sharedId
      ),
    [entity.sharedId, mainDocument?._id, relationships]
  );

  const colorOf = useCallback(
    (marker: RelationshipMarker) =>
      templates.find(template => template._id === marker.target.templateId)?.color || '#A4CAFE',
    [templates]
  );

  return { liveMarkers, colorOf };
};

const useRelationshipHighlightContext = (mainPdfController: PDFControls | null) => {
  const { activeRelationshipId, setActiveRelationshipId, setScrollToRelationshipPanel } =
    useDocumentRelationshipNav();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const { activeClusterRefIds } = useRelationshipsPanelFacetFilters();
  const ensureResolved = useEnsureResolved();
  const { resolved } = useRelationshipQueryStatus();
  const pdfControllerRef = usePdfControllerRef(mainPdfController);
  const { getSelectedMarker, setSelectedMarker } = useSelectedMarkerRef();
  const actions: RelationshipHighlightActions = {
    setActiveRelationshipId,
    setSelectedMarker,
    setScrollToRelationshipPanel,
    setExpandForRefId,
  };

  return {
    actions,
    activeClusterRefIds,
    activeRelationshipId,
    ensureResolved,
    getSelectedMarker,
    mainPdfController,
    pdfControllerRef,
    resolved,
    setSelectedMarker,
  };
};

const useActiveRelationshipHighlight = () => {
  const { pdfController: mainPdfController } = useDocumentPdf();
  const { liveMarkers, colorOf } = useRelationshipLiveMarkers();
  const {
    actions,
    activeClusterRefIds,
    activeRelationshipId,
    ensureResolved,
    getSelectedMarker,
    mainPdfController: pdfController,
    pdfControllerRef,
    resolved,
    setSelectedMarker,
  } = useRelationshipHighlightContext(mainPdfController);

  const selectRelationship = useCallback(
    async (marker: RelationshipMarker, options?: { scrollPanel?: boolean }) => {
      if (marker._id === activeRelationshipId) {
        deselectActiveRelationship(actions, pdfControllerRef.current);
        return;
      }
      activateRelationshipSelection({
        marker,
        options,
        actions,
        colorOf,
        pdfController: pdfControllerRef.current,
      });
      await ensureResolved();
    },
    [actions, activeRelationshipId, colorOf, ensureResolved, pdfControllerRef]
  );

  const clearRelationshipSelection = useCallback(() => {
    setSelectedMarker(null);
    actions.setActiveRelationshipId(null);
    clearRelationshipPdfHighlights(pdfControllerRef.current);
  }, [actions, pdfControllerRef, setSelectedMarker]);

  useEffect(() => {
    syncActiveRelationshipHighlight({
      activeRelationshipId,
      activeClusterRefIds,
      liveMarkers,
      getSelectedMarker,
      setSelectedMarker,
      colorOf,
      mainPdfController: pdfController,
    });
  }, [
    activeClusterRefIds,
    activeRelationshipId,
    colorOf,
    getSelectedMarker,
    liveMarkers,
    pdfController,
    resolved,
    setSelectedMarker,
  ]);

  return { activeRelationshipId, selectRelationship, clearRelationshipSelection };
};

export { useActiveRelationshipHighlight };
