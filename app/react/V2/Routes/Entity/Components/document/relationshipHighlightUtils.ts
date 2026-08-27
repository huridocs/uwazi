import { PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';

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
};

type SyncHighlightInput = {
  activeRelationshipId: string | null;
  activeClusterRefIds: string[] | null | undefined;
  liveMarkers: RelationshipMarker[];
  getSelectedMarker: () => RelationshipMarker | null;
  setSelectedMarker: (marker: RelationshipMarker | null) => void;
  colorOf: (marker: RelationshipMarker) => string;
  mainPdfController: PDFControls | null;
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

const deselectActiveRelationship = (
  actions: Pick<RelationshipHighlightActions, 'setActiveRelationshipId' | 'setSelectedMarker'>,
  pdfController: PDFControls | null
) => {
  actions.setSelectedMarker(null);
  actions.setActiveRelationshipId(null);
  clearRelationshipPdfHighlights(pdfController);
};

const activateRelationshipSelection = ({
  marker,
  options,
  actions,
  colorOf,
  pdfController,
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
  syncPdfWithMarker(marker, colorOf, pdfController);
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
}: SyncHighlightInput) => {
  if (!activeRelationshipId) {
    setSelectedMarker(null);
    if (!activeClusterRefIds?.length) clearRelationshipPdfHighlights(mainPdfController);
    return;
  }
  const marker = findLiveMarker(activeRelationshipId, liveMarkers, getSelectedMarker);
  if (!marker || !mainPdfController) return;
  setSelectedMarker(marker);
  syncPdfWithMarker(marker, colorOf, mainPdfController);
};

export {
  activateRelationshipSelection,
  clearRelationshipPdfHighlights,
  deselectActiveRelationship,
  syncActiveRelationshipHighlight,
  syncPdfWithMarker,
};
export type { RelationshipHighlightActions, SelectOptions };
