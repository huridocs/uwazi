import { RelationshipMarker } from '#V2/Components/Relationships/types.js';

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

export { getMarkerRefIds, toggleClusterIfActive };
