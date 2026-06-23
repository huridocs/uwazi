import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import {
  computeStats,
  filterAndSortMarkers,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { computeFacetCounts } from '#V2/formatters/relationships/relationshipsPanelFacets.js';
import {
  useEntityScopedEntity,
  useRelationshipsPanelFilterInputs,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityRelationshipMarkers } from './useEntityRelationshipMarkers.js';

const useRelationshipsPanelData = () => {
  const entity = useEntityScopedEntity();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const filters = useRelationshipsPanelFilterInputs();
  const sourceMarkers = useEntityRelationshipMarkers();
  const relationshipTypeName = useCallback(
    (typeId: string) => relationshipTypes.find(type => type._id === typeId)?.name ?? '',
    [relationshipTypes]
  );
  const markers = useMemo(
    () =>
      filterAndSortMarkers(sourceMarkers, {
        searchQuery: filters.search,
        sortOrder: filters.sort,
        selfSharedId: entity.sharedId,
        relationshipTypeName,
        relTypeFilters: filters.relTypeFilters,
        entityTypeFilters: filters.entityTypeFilters,
        activeClusterRefIds: filters.activeClusterRefIds,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const stats = useMemo(() => computeStats(markers, entity.sharedId), [entity.sharedId, markers]);
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
