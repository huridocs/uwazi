import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { toMarker } from '#V2/Components/Relationships/types.js';
import {
  computeStats,
  filterAndSortMarkers,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { computeFacetCounts } from '#V2/formatters/relationships/relationshipsPanelFacets.js';
import {
  useEntityScopedEntity,
  useRelationships,
  useRelationshipsPanelFilterInputs,
} from '#V2/Routes/Entity/Components/context/index.js';

const useRelationshipsPanelData = () => {
  const entity = useEntityScopedEntity();
  const { relationships } = useRelationships();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const filters = useRelationshipsPanelFilterInputs();
  const sourceMarkers = useMemo(
    () => relationships.map(view => toMarker(view, entity.sharedId)),
    [relationships, entity.sharedId]
  );
  const relationshipTypeName = useCallback(
    (typeId: string) => relationshipTypes.find(type => type._id === typeId)?.name ?? '',
    [relationshipTypes]
  );
  const markers = useMemo(
    () =>
      filterAndSortMarkers(sourceMarkers, {
        searchQuery: filters.search,
        sortOrder: filters.sort,
        relationshipTypeName,
        relTypeFilters: filters.relTypeFilters,
        entityTypeFilters: filters.entityTypeFilters,
        activeClusterRefIds: filters.activeClusterRefIds,
      }),
    [
      filters.activeClusterRefIds,
      filters.entityTypeFilters,
      filters.relTypeFilters,
      filters.search,
      filters.sort,
      relationshipTypeName,
      sourceMarkers,
    ]
  );
  const stats = useMemo(() => computeStats(markers), [markers]);
  const facetCounts = useMemo(() => computeFacetCounts(sourceMarkers), [sourceMarkers]);

  return {
    markers,
    sourceMarkers,
    stats,
    facetCounts,
    hasRelationships: sourceMarkers.length > 0,
  };
};

export { useRelationshipsPanelData };
