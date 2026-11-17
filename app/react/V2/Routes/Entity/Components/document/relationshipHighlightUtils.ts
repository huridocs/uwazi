import { PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { paintDocumentHighlightNow, type PaintDocumentHighlight } from './documentHighlightGate.js';

type SelectOptions = {
  scrollPanel?: boolean;
};

type RelationshipHighlightActions = {
  setActiveRelationshipId: (id: string | null) => void;
  setSelectedMarker: (marker: RelationshipMarker | null) => void;
  setScrollToRelationshipPanel: (id: string) => void;
  setExpandForRefId: (id: string) => void;
};

type ActivateSelectionInput = {
  marker: RelationshipMarker;
  options?: SelectOptions;
  actions: RelationshipHighlightActions;
  colorOf: (marker: RelationshipMarker) => string;
  pdfController: PDFControls | null;
  paintHighlight?: PaintDocumentHighlight;
};

type SyncHighlightInput = {
  activeRelationshipId: string | null;
  activeClusterRefIds: string[] | null | undefined;
  liveMarkers: RelationshipMarker[];
  getSelectedMarker: () => RelationshipMarker | null;
  setSelectedMarker: (marker: RelationshipMarker | null) => void;
  colorOf: (marker: RelationshipMarker) => string;
  mainPdfController: PDFControls | null;
  paintHighlight?: PaintDocumentHighlight;
};

const paintPdfHighlights = (
  pdfController: PDFControls | null,
  highlights: Parameters<PDFControls['toggleHighlights']>[0],
  paintHighlight: PaintDocumentHighlight
) => {
  paintHighlight(() => {
    pdfController?.toggleHighlights(highlights);
  });
};

const clearRelationshipPdfHighlights = (
  pdfController: PDFControls | null,
  paintHighlight: PaintDocumentHighlight = paintDocumentHighlightNow
) => {
  paintPdfHighlights(pdfController, [], paintHighlight);
};

const syncPdfWithMarker = (
  marker: RelationshipMarker,
  colorOf: (marker: RelationshipMarker) => string,
  pdf: { controller: PDFControls | null; paintHighlight: PaintDocumentHighlight }
) => {
  const page = marker.anchor?.selections?.[0]?.page;
  const highlight = relationshipToHighlight(marker.anchor, colorOf(marker), marker._id);
  if (page) pdf.controller?.goToPage(page);
  paintPdfHighlights(pdf.controller, highlight ? [highlight] : [], pdf.paintHighlight);
};

const scrollRelationshipPanel = (
  markerId: string,
  setScrollToRelationshipPanel: (id: string) => void,
  setExpandForRefId: (id: string) => void
) => {
  setScrollToRelationshipPanel(markerId);
  setExpandForRefId(markerId);
};

const deselectActiveRelationship = (
  actions: Pick<RelationshipHighlightActions, 'setActiveRelationshipId' | 'setSelectedMarker'>,
  pdfController: PDFControls | null,
  paintHighlight: PaintDocumentHighlight = paintDocumentHighlightNow
) => {
  actions.setSelectedMarker(null);
  actions.setActiveRelationshipId(null);
  clearRelationshipPdfHighlights(pdfController, paintHighlight);
};

const activateRelationshipSelection = ({
  marker,
  options,
  actions,
  colorOf,
  pdfController,
  paintHighlight = paintDocumentHighlightNow,
}: ActivateSelectionInput) => {
  actions.setActiveRelationshipId(marker._id);
  actions.setSelectedMarker(marker);
  if (options?.scrollPanel) {
    scrollRelationshipPanel(
      marker._id,
      actions.setScrollToRelationshipPanel,
      actions.setExpandForRefId
    );
  }
  syncPdfWithMarker(marker, colorOf, { controller: pdfController, paintHighlight });
};

const findLiveMarker = (
  activeRelationshipId: string,
  liveMarkers: RelationshipMarker[],
  getSelectedMarker: () => RelationshipMarker | null
) => {
  const selectedMarker = getSelectedMarker();
  return (
    liveMarkers.find(liveMarker => liveMarker._id === activeRelationshipId) ??
    (selectedMarker?._id === activeRelationshipId ? selectedMarker : null)
  );
};

const syncActiveRelationshipHighlight = ({
  activeRelationshipId,
  activeClusterRefIds,
  liveMarkers,
  getSelectedMarker,
  setSelectedMarker,
  colorOf,
  mainPdfController,
  paintHighlight = paintDocumentHighlightNow,
}: SyncHighlightInput) => {
  if (!activeRelationshipId) {
    setSelectedMarker(null);
    if (!activeClusterRefIds?.length) {
      clearRelationshipPdfHighlights(mainPdfController, paintHighlight);
    }
    return;
  }
  const marker = findLiveMarker(activeRelationshipId, liveMarkers, getSelectedMarker);
  if (!marker || !mainPdfController) return;
  setSelectedMarker(marker);
  syncPdfWithMarker(marker, colorOf, { controller: mainPdfController, paintHighlight });
};

export {
  activateRelationshipSelection,
  clearRelationshipPdfHighlights,
  deselectActiveRelationship,
  syncActiveRelationshipHighlight,
  syncPdfWithMarker,
};
export type { RelationshipHighlightActions, SelectOptions };
