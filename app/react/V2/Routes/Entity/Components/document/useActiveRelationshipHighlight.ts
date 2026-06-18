import { useCallback } from 'react';
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

const useActiveRelationshipHighlight = () => {
  const { activeRelationshipId, setActiveRelationshipId, setScrollToRelationshipPanel } =
    useDocumentRelationshipNav();
  const { pdfController: mainPdfController } = useDocumentPdf();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const templates = useAtomValue(templatesAtom);

  const colorOf = useCallback(
    (marker: RelationshipMarker) =>
      templates.find(template => template._id === marker.target.templateId)?.color || '#A4CAFE',
    [templates]
  );

  const selectRelationship = useCallback(
    (marker: RelationshipMarker, options?: SelectOptions) => {
      if (marker._id === activeRelationshipId) {
        setActiveRelationshipId(null);
        clearRelationshipPdfHighlights(mainPdfController);
        return;
      }

      setActiveRelationshipId(marker._id);
      if (options?.scrollPanel) {
        setScrollToRelationshipPanel(marker._id);
        setExpandForRefId(marker._id);
      }
      syncPdfWithMarker(marker, colorOf, mainPdfController);
    },
    [
      activeRelationshipId,
      colorOf,
      mainPdfController,
      setActiveRelationshipId,
      setScrollToRelationshipPanel,
      setExpandForRefId,
    ]
  );

  const clearRelationshipSelection = useCallback(() => {
    setActiveRelationshipId(null);
    clearRelationshipPdfHighlights(mainPdfController);
  }, [mainPdfController, setActiveRelationshipId]);

  return { activeRelationshipId, selectRelationship, clearRelationshipSelection };
};

export { useActiveRelationshipHighlight };
