import { relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type ActivateClusterParams = {
  ids: string[];
  clusterPage: number;
  setActiveClusterRefIds: (ids: string[]) => void;
  clearRelationshipSelection: () => void;
  focusRelationshipsPanel: () => void;
  mainPdfController: PDFControls | null | undefined;
  ensureResolved: () => Promise<void>;
};

const getMarkerRefIds = (markers: RelationshipMarker[]): string[] =>
  markers.map(marker => marker._id);

const isSameClusterSelection = (activeClusterRefIds: string[] | null, ids: string[]): boolean =>
  activeClusterRefIds !== null &&
  activeClusterRefIds.length === ids.length &&
  ids.every(id => activeClusterRefIds.includes(id));

const toggleClusterIfActive = (
  activeClusterRefIds: string[] | null,
  ids: string[],
  onClear: () => void
): boolean => {
  if (!isSameClusterSelection(activeClusterRefIds, ids)) return false;
  onClear();
  return true;
};

const clusterMarkersToHighlights = (
  markers: RelationshipMarker[],
  colorOf: (marker: RelationshipMarker) => string
) =>
  markers.flatMap(marker => {
    const highlight = relationshipToHighlight(marker.anchor, colorOf(marker), marker._id);
    return highlight ? [highlight] : [];
  });

const activateDocumentCluster = async ({
  ids,
  clusterPage,
  setActiveClusterRefIds,
  clearRelationshipSelection,
  focusRelationshipsPanel,
  mainPdfController,
  ensureResolved,
}: ActivateClusterParams) => {
  setActiveClusterRefIds(ids);
  clearRelationshipSelection();
  focusRelationshipsPanel();
  mainPdfController?.goToPage(clusterPage);
  await ensureResolved();
};

export { getMarkerRefIds, toggleClusterIfActive, clusterMarkersToHighlights, activateDocumentCluster };
