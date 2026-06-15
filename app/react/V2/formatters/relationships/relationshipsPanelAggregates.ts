import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
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

const firstPageOf = (marker: RelationshipMarker): number | undefined =>
  marker.anchor?.selections[0]?.page;

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
    if (existing) {
      existing.markerIds.push(marker._id);
      if (!existing.directions.includes(direction)) existing.directions.push(direction);
      if (page !== undefined && (existing.firstPage === undefined || page < existing.firstPage)) {
        existing.firstPage = page;
      }
    } else {
      map.set(key, {
        id: key,
        targetSharedId: marker.target.sharedId,
        targetTitle: marker.target.title,
        targetTemplateId: marker.target.templateId,
        relationType: marker.view.type,
        directions: [direction],
        firstPage: page,
        markerIds: [marker._id],
      });
    }
  }
  return map;
};

const listAggregates = (
  markers: RelationshipMarker[],
  selfSharedId: string
): RelationshipAggregate[] => Array.from(deriveAggregates(markers, selfSharedId).values());

export type { RelationshipAggregate };
export { aggregateKey, deriveAggregates, listAggregates };
