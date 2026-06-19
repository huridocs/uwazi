import { Entity } from '#V2/api/entities/types.js';
import { RelationshipMarker, firstPageOf, toMarker } from '#V2/Components/Relationships/types.js';
import { formatRelationships } from './formatRelationships.js';
import { buildPanelListEntries } from './relationshipsPanelDerivation.js';
import { buildMatcher } from './relationshipsPanelSearchQuery.js';

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

const computeStats = (
  markers: RelationshipMarker[],
  selfSharedId: string
): RelationshipsPanelStats => ({
  references: markers.length,
  entities: new Set(markers.map(marker => marker.target.sharedId)).size,
  aggregates: buildPanelListEntries(markers, selfSharedId).length,
});

const projectRelationshipMarkers = (entity: Entity): RelationshipMarker[] =>
  formatRelationships(entity).map(view => toMarker(view, entity.sharedId));

const projectRelationshipsPanel = (entity: Entity): RelationshipsPanelProjection => {
  const markers = projectRelationshipMarkers(entity);
  return { markers, stats: computeStats(markers, entity.sharedId) };
};

const countEntityRelationships = (entity: Entity): number =>
  projectRelationshipMarkers(entity).length;

const markerHaystack = (marker: RelationshipMarker, relationshipTypeName: string): string =>
  `${marker.anchor?.text ?? ''} ${marker.target.title} ${relationshipTypeName}`.toLowerCase();

const compareAppearance = (a: RelationshipMarker, b: RelationshipMarker): number => {
  const anchorRank = (marker: RelationshipMarker) => (marker.anchor ? 0 : 1);
  const rankDiff = anchorRank(a) - anchorRank(b);
  if (rankDiff !== 0) return rankDiff;

  const pageA = firstPageOf(a) ?? 0;
  const pageB = firstPageOf(b) ?? 0;
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

const filterByIds = (
  markers: RelationshipMarker[],
  ids: string[],
  getId: (marker: RelationshipMarker) => string
): RelationshipMarker[] => {
  if (!ids.length) return markers;
  const allowed = new Set(ids);
  return markers.filter(marker => allowed.has(getId(marker)));
};

const filterByCluster = (
  markers: RelationshipMarker[],
  clusterIds: string[] | null | undefined
): RelationshipMarker[] => {
  if (!clusterIds?.length) return markers;
  const cluster = new Set(clusterIds);
  return markers.filter(marker => cluster.has(marker._id));
};

const filterBySearch = (
  markers: RelationshipMarker[],
  searchQuery: string,
  relationshipTypeName: (typeId: string) => string
): RelationshipMarker[] => {
  const matcher = buildMatcher(searchQuery);
  if (!matcher) return markers;
  return markers.filter(marker =>
    matcher(markerHaystack(marker, relationshipTypeName(marker.view.type)))
  );
};

const sortRelationshipMarkers = (
  markers: RelationshipMarker[],
  sortOrder: RelationshipsPanelSort
): RelationshipMarker[] => {
  if (sortOrder === 'none') return markers;
  if (sortOrder === 'appearance') return [...markers].sort(compareAppearance);
  const dir = sortOrder === 'asc' ? 1 : -1;
  return [...markers].sort((a, b) => a.target.title.localeCompare(b.target.title) * dir);
};

const filterAndSortMarkers = (
  markers: RelationshipMarker[],
  options: RelationshipsPanelFilterOptions
): RelationshipMarker[] => {
  let result = filterByCluster(markers, options.activeClusterRefIds);
  result = filterByIds(result, activeFacetIds(options.relTypeFilters), marker => marker.view.type);
  result = filterByIds(
    result,
    activeFacetIds(options.entityTypeFilters),
    marker => marker.target.templateId || 'unknown'
  );
  result = filterBySearch(result, options.searchQuery, options.relationshipTypeName);
  return sortRelationshipMarkers(result, options.sortOrder);
};

export type {
  RelationshipsPanelSort,
  RelationshipsPanelStats,
  RelationshipsPanelProjection,
  RelationshipsPanelFilterOptions,
};
export {
  projectRelationshipMarkers,
  projectRelationshipsPanel,
  filterAndSortMarkers,
  computeStats,
  compareAppearance,
  countEntityRelationships,
};
