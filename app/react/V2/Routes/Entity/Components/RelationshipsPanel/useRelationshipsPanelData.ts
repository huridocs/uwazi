import { useAtomValue } from 'jotai';
import {
  relationshipsPanelFilteredMarkersAtom,
  relationshipsPanelHasRelationshipsAtom,
  relationshipsPanelSourceMarkersAtom,
  relationshipsPanelStatsAtom,
} from './relationshipsPanelDataAtoms.js';

const useRelationshipsPanelData = () => {
  const markers = useAtomValue(relationshipsPanelFilteredMarkersAtom);
  const sourceMarkers = useAtomValue(relationshipsPanelSourceMarkersAtom);
  const stats = useAtomValue(relationshipsPanelStatsAtom);
  const hasRelationships = useAtomValue(relationshipsPanelHasRelationshipsAtom);

  return { markers, sourceMarkers, stats, hasRelationships };
};

export { useRelationshipsPanelData };
