import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  useDocumentPdf,
  useDocumentRelationshipNav,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';

type SelectOptions = {
  scrollPanel?: boolean;
};

const clearRelationshipPdfHighlights = (pdfController: PDFControls | null) => {
  pdfController?.toggleHighlights([]);
};

const syncPdfWithMarker = (
  marker: RelationshipMarker,
  colorOf: (marker: RelationshipMarker) => string,
  pdfController: PDFControls | null
) => {
  const page = marker.anchor?.selections?.[0]?.page;
  const highlight = relationshipToHighlight(marker.anchor, colorOf(marker), marker._id);
  if (page) pdfController?.goToPage(page);
  pdfController?.toggleHighlights(highlight ? [highlight] : []);
};

const scrollRelationshipPanel = (
  markerId: string,
  setScrollToRelationshipPanel: (id: string) => void,
  setExpandForRefId: (id: string) => void
) => {
  setScrollToRelationshipPanel(markerId);
  setExpandForRefId(markerId);
};

const useRelationshipHighlightRefs = (mainPdfController: PDFControls | null) => {
  const pdfControllerRef = useRef(mainPdfController);
  pdfControllerRef.current = mainPdfController;
  const selectedMarkerRef = useRef<RelationshipMarker | null>(null);
  return { pdfControllerRef, selectedMarkerRef };
};

const useActiveRelationshipHighlight = () => {
  const { activeRelationshipId, setActiveRelationshipId, setScrollToRelationshipPanel } =
    useDocumentRelationshipNav();
  const { pdfController: mainPdfController } = useDocumentPdf();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const templates = useAtomValue(templatesAtom);
  const { pdfControllerRef, selectedMarkerRef } = useRelationshipHighlightRefs(mainPdfController);

  const colorOf = useCallback(
    (marker: RelationshipMarker) =>
      templates.find(template => template._id === marker.target.templateId)?.color || '#A4CAFE',
    [templates]
  );

  const selectRelationship = useCallback(
    (marker: RelationshipMarker, options?: SelectOptions) => {
      if (marker._id === activeRelationshipId) {
        selectedMarkerRef.current = null;
        setActiveRelationshipId(null);
        clearRelationshipPdfHighlights(pdfControllerRef.current);
        return;
      }

      setActiveRelationshipId(marker._id);
      selectedMarkerRef.current = marker;
      if (options?.scrollPanel) {
        scrollRelationshipPanel(marker._id, setScrollToRelationshipPanel, setExpandForRefId);
      }
      syncPdfWithMarker(marker, colorOf, pdfControllerRef.current);
    },
    [
      activeRelationshipId,
      colorOf,
      pdfControllerRef,
      selectedMarkerRef,
      setActiveRelationshipId,
      setScrollToRelationshipPanel,
      setExpandForRefId,
    ]
  );

  const clearRelationshipSelection = useCallback(() => {
    selectedMarkerRef.current = null;
    setActiveRelationshipId(null);
    clearRelationshipPdfHighlights(pdfControllerRef.current);
  }, [pdfControllerRef, selectedMarkerRef, setActiveRelationshipId]);

  useEffect(() => {
    if (!activeRelationshipId) {
      selectedMarkerRef.current = null;
      clearRelationshipPdfHighlights(mainPdfController);
      return;
    }
    const marker = selectedMarkerRef.current;
    if (!marker || marker._id !== activeRelationshipId || !mainPdfController) return;
    syncPdfWithMarker(marker, colorOf, mainPdfController);
  }, [activeRelationshipId, mainPdfController, colorOf, selectedMarkerRef]);

  return { activeRelationshipId, selectRelationship, clearRelationshipSelection };
};

export { useActiveRelationshipHighlight };
