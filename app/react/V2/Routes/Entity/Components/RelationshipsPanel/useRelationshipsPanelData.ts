import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Entity } from '#V2/api/entities/types.js';
import {
  relationshipsPanelEntityAtom,
  relationshipsPanelFilteredMarkersAtom,
  relationshipsPanelHasRelationshipsAtom,
  relationshipsPanelSourceMarkersAtom,
  relationshipsPanelStatsAtom,
} from './relationshipsPanelDataAtoms.js';

const useRelationshipsPanelData = (entity?: Entity) => {
  const setEntity = useSetAtom(relationshipsPanelEntityAtom);
  const markers = useAtomValue(relationshipsPanelFilteredMarkersAtom);
  const sourceMarkers = useAtomValue(relationshipsPanelSourceMarkersAtom);
  const stats = useAtomValue(relationshipsPanelStatsAtom);
  const hasRelationships = useAtomValue(relationshipsPanelHasRelationshipsAtom);

  useEffect(() => {
    setEntity(entity);
    return () => setEntity(undefined);
  }, [entity, setEntity]);

  return { markers, sourceMarkers, stats, hasRelationships };
};

export { useRelationshipsPanelData };
