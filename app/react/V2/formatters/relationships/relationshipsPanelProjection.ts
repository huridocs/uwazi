import { Entity } from '#V2/api/entities/types.js';
import { RelationshipMarker, toMarker } from '#V2/Components/Relationships/types.js';
import { formatRelationships } from './formatRelationships.js';

type RelationshipsPanelSort = 'none' | 'appearance' | 'asc' | 'desc';

type RelationshipsPanelStats = {
  references: number;
  entities: number;
  aggregates: number;
};

type RelationshipsPanelProjection = {
  markers: RelationshipMarker[];
  stats: RelationshipsPanelStats;
};

const aggregateKey = (marker: RelationshipMarker): string =>
  `${marker.target.sharedId}::${marker.view.type}`;

const computeStats = (markers: RelationshipMarker[]): RelationshipsPanelStats => ({
  references: markers.length,
  entities: new Set(markers.map(marker => marker.target.sharedId)).size,
  aggregates: new Set(markers.map(aggregateKey)).size,
});

const projectRelationshipsPanel = (entity: Entity): RelationshipsPanelProjection => {
  const markers = formatRelationships(entity).map(view => toMarker(view, entity.sharedId));
  return { markers, stats: computeStats(markers) };
};

const markerHaystack = (marker: RelationshipMarker, relationshipTypeName: string): string =>
  `${marker.anchor?.text ?? ''} ${marker.target.title} ${relationshipTypeName}`.toLowerCase();

const compareAppearance = (a: RelationshipMarker, b: RelationshipMarker): number => {
  const pageA = a.anchor?.selections?.[0]?.page ?? -1;
  const pageB = b.anchor?.selections?.[0]?.page ?? -1;
  if (pageA !== pageB) return pageA - pageB;
  const topA = a.anchor?.selections?.[0]?.top ?? 0;
  const topB = b.anchor?.selections?.[0]?.top ?? 0;
  return topA - topB;
};

const filterAndSortMarkers = (
  markers: RelationshipMarker[],
  options: {
    searchQuery: string;
    sortOrder: RelationshipsPanelSort;
    relationshipTypeName: (typeId: string) => string;
  }
): RelationshipMarker[] => {
  const query = options.searchQuery.trim().toLowerCase();
  let result = markers;

  if (query) {
    result = result.filter(marker =>
      markerHaystack(marker, options.relationshipTypeName(marker.view.type)).includes(query)
    );
  }

  if (options.sortOrder === 'none') {
    return result;
  }

  if (options.sortOrder === 'appearance') {
    return [...result].sort(compareAppearance);
  }

  const dir = options.sortOrder === 'asc' ? 1 : -1;
  return [...result].sort((a, b) => a.target.title.localeCompare(b.target.title) * dir);
};

export type { RelationshipsPanelSort, RelationshipsPanelStats, RelationshipsPanelProjection };
export { projectRelationshipsPanel, filterAndSortMarkers, computeStats };
