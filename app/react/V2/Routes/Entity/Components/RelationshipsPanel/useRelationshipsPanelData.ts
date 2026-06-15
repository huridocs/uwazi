import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Entity } from '#V2/api/entities/types.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import {
  computeStats,
  filterAndSortMarkers,
  projectRelationshipsPanel,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
} from './relationshipsPanelFiltersAtom.js';

const useRelationshipsPanelData = (entity?: Entity) => {
  const searchQuery = useAtomValue(relationshipsPanelSearchAtom);
  const sortOrder = useAtomValue(relationshipsPanelSortAtom);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);

  const projection = useMemo(
    () => (entity ? projectRelationshipsPanel(entity) : { markers: [], stats: computeStats([]) }),
    [entity]
  );

  const relationshipTypeName = useMemo(() => {
    const byId = new Map(relationshipTypes.map(type => [type._id, type.name ?? '']));
    return (typeId: string) => byId.get(typeId) ?? '';
  }, [relationshipTypes]);

  const markers = useMemo(
    () =>
      filterAndSortMarkers(projection.markers, {
        searchQuery,
        sortOrder,
        relationshipTypeName,
      }),
    [projection.markers, searchQuery, sortOrder, relationshipTypeName]
  );

  const stats = useMemo(() => computeStats(markers), [markers]);

  return { markers, stats, hasRelationships: projection.markers.length > 0 };
};

export { useRelationshipsPanelData };
