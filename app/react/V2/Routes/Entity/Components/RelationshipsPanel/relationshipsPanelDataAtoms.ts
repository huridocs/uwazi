import { atom } from 'jotai';
import { Entity } from '#V2/api/entities/types.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import {
  computeStats,
  filterAndSortMarkers,
  projectRelationshipsPanel,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { computeFacetCounts } from '#V2/formatters/relationships/relationshipsPanelFacets.js';
import {
  relationshipsPanelActiveClusterRefIdsAtom,
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelRelTypeFiltersAtom,
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
} from './relationshipsPanelFiltersAtom.js';

const relationshipsPanelEntityAtom = atom<Entity | undefined>(undefined);

const relationshipsPanelSourceMarkersAtom = atom(get => {
  const entity = get(relationshipsPanelEntityAtom);
  return entity ? projectRelationshipsPanel(entity).markers : [];
});

const relationshipsPanelFilteredMarkersAtom = atom(get => {
  const markers = get(relationshipsPanelSourceMarkersAtom);
  const relationshipTypes = get(relationshipTypesAtom);
  const relationshipTypeName = (typeId: string) =>
    relationshipTypes.find(type => type._id === typeId)?.name ?? '';

  return filterAndSortMarkers(markers, {
    searchQuery: get(relationshipsPanelSearchAtom),
    sortOrder: get(relationshipsPanelSortAtom),
    relationshipTypeName,
    relTypeFilters: get(relationshipsPanelRelTypeFiltersAtom),
    entityTypeFilters: get(relationshipsPanelEntityTypeFiltersAtom),
    activeClusterRefIds: get(relationshipsPanelActiveClusterRefIdsAtom),
  });
});

const relationshipsPanelStatsAtom = atom(get =>
  computeStats(get(relationshipsPanelFilteredMarkersAtom))
);

const relationshipsPanelFacetCountsAtom = atom(get =>
  computeFacetCounts(get(relationshipsPanelSourceMarkersAtom))
);

const relationshipsPanelHasRelationshipsAtom = atom(
  get => get(relationshipsPanelSourceMarkersAtom).length > 0
);

export {
  relationshipsPanelEntityAtom,
  relationshipsPanelSourceMarkersAtom,
  relationshipsPanelFilteredMarkersAtom,
  relationshipsPanelStatsAtom,
  relationshipsPanelFacetCountsAtom,
  relationshipsPanelHasRelationshipsAtom,
};
