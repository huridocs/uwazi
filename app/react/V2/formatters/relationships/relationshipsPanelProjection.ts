import { Entity } from '#V2/api/entities/types.js';
import { RelationshipMarker, toMarker } from '#V2/Components/Relationships/types.js';
import { formatRelationships } from './formatRelationships.js';
import { buildMatcher } from './relationshipsPanelSearchQuery.js';
import { aggregateKey } from './relationshipsPanelAggregates.js';

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

const computeStats = (markers: RelationshipMarker[]): RelationshipsPanelStats => ({
  references: markers.filter(marker => marker.anchor).length,
  entities: new Set(markers.map(marker => marker.target.sharedId)).size,
  aggregates: new Set(markers.map(aggregateKey)).size,
});

const projectRelationshipsPanel = (entity: Entity): RelationshipsPanelProjection => {
  const markers = formatRelationships(entity).map(view => toMarker(view, entity.sharedId));
  return { markers, stats: computeStats(markers) };
};

const countEntityRelationships = (entity: Entity): number =>
  projectRelationshipsPanel(entity).markers.length;

const markerHaystack = (marker: RelationshipMarker, relationshipTypeName: string): string =>
  `${marker.anchor?.text ?? ''} ${marker.target.title} ${relationshipTypeName}`.toLowerCase();

const compareAppearance = (a: RelationshipMarker, b: RelationshipMarker): number => {
  const anchorRank = (marker: RelationshipMarker) => (marker.anchor ? 0 : 1);
  const rankDiff = anchorRank(a) - anchorRank(b);
  if (rankDiff !== 0) return rankDiff;

  const pageA = a.anchor?.selections?.[0]?.page ?? 0;
  const pageB = b.anchor?.selections?.[0]?.page ?? 0;
  if (pageA !== pageB) return pageA - pageB;
  const topA = a.anchor?.selections?.[0]?.top ?? 0;
  const topB = b.anchor?.selections?.[0]?.top ?? 0;
  return topA - topB;
};

type RelationshipsPanelFilterOptions = {
  searchQuery: string;
  sortOrder: RelationshipsPanelSort;
  relationshipTypeName: (typeId: string) => string;
  relTypeFilters?: Record<string, boolean>;
  entityTypeFilters?: Record<string, boolean>;
  activeClusterRefIds?: string[] | null;
};

const activeFacetIds = (filters: Record<string, boolean> | undefined): string[] =>
  Object.entries(filters ?? {})
    .filter(([, active]) => active)
    .map(([id]) => id);

const filterAndSortMarkers = (
  markers: RelationshipMarker[],
  options: RelationshipsPanelFilterOptions
): RelationshipMarker[] => {
  let result = markers;

  const clusterIds = options.activeClusterRefIds;
  if (clusterIds?.length) {
    const cluster = new Set(clusterIds);
    result = result.filter(marker => cluster.has(marker._id));
  }

  const relTypes = activeFacetIds(options.relTypeFilters);
  if (relTypes.length) {
    const allowed = new Set(relTypes);
    result = result.filter(marker => allowed.has(marker.view.type));
  }

  const entityTypes = activeFacetIds(options.entityTypeFilters);
  if (entityTypes.length) {
    const allowed = new Set(entityTypes);
    result = result.filter(marker => {
      const templateId = marker.target.templateId || 'unknown';
      return allowed.has(templateId);
    });
  }

  const matcher = buildMatcher(options.searchQuery);
  if (matcher) {
    result = result.filter(marker =>
      matcher(markerHaystack(marker, options.relationshipTypeName(marker.view.type)))
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

export type {
  RelationshipsPanelSort,
  RelationshipsPanelStats,
  RelationshipsPanelProjection,
  RelationshipsPanelFilterOptions,
};
export {
  projectRelationshipsPanel,
  filterAndSortMarkers,
  computeStats,
  compareAppearance,
  countEntityRelationships,
};
