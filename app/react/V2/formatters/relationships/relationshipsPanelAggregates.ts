import { RelationshipMarker, firstPageOf } from '#V2/Components/Relationships/types.js';
import { directionOf, type RelationshipDirection } from './types.js';

type RelationshipAggregate = {
  id: string;
  targetSharedId: string;
  targetTitle: string;
  targetTemplateId: string;
  relationType: string;
  directions: RelationshipDirection[];
  firstPage?: number;
  markerIds: string[];
};

const aggregateKey = (marker: RelationshipMarker): string =>
  `${marker.target.sharedId}::${marker.view.type}`;

const mergeIntoAggregate = (
  existing: RelationshipAggregate,
  marker: RelationshipMarker,
  direction: RelationshipDirection,
  page: number | undefined
): RelationshipAggregate => ({
  ...existing,
  markerIds: [...existing.markerIds, marker._id],
  directions: existing.directions.includes(direction)
    ? existing.directions
    : [...existing.directions, direction],
  firstPage:
    page !== undefined && (existing.firstPage === undefined || page < existing.firstPage)
      ? page
      : existing.firstPage,
});

const createAggregate = (
  marker: RelationshipMarker,
  key: string,
  direction: RelationshipDirection,
  page: number | undefined
): RelationshipAggregate => ({
  id: key,
  targetSharedId: marker.target.sharedId,
  targetTitle: marker.target.title,
  targetTemplateId: marker.target.templateId,
  relationType: marker.view.type,
  directions: [direction],
  firstPage: page,
  markerIds: [marker._id],
});

const deriveAggregates = (
  markers: RelationshipMarker[],
  selfSharedId: string
): Map<string, RelationshipAggregate> => {
  const map = new Map<string, RelationshipAggregate>();
  for (const marker of markers) {
    const key = aggregateKey(marker);
    const direction = directionOf(marker.view, selfSharedId);
    const page = firstPageOf(marker);
    const existing = map.get(key);
    if (existing) map.set(key, mergeIntoAggregate(existing, marker, direction, page));
    else map.set(key, createAggregate(marker, key, direction, page));
  }
  return map;
};

const listAggregates = (
  markers: RelationshipMarker[],
  selfSharedId: string
): RelationshipAggregate[] => Array.from(deriveAggregates(markers, selfSharedId).values());

export type { RelationshipAggregate };
export { aggregateKey, deriveAggregates, listAggregates };
