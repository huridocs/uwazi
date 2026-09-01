import { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type RelationshipsPanelFacetCounts = {
  byRelType: [string, number][];
  byEntityType: [string, number][];
  total: number;
};

const computeFacetCounts = (markers: RelationshipMarker[]): RelationshipsPanelFacetCounts => {
  const rel = new Map<string, number>();
  const ent = new Map<string, number>();

  markers.forEach(marker => {
    rel.set(marker.relationship.type, (rel.get(marker.relationship.type) ?? 0) + 1);
    const templateId = marker.target.templateId || 'unknown';
    ent.set(templateId, (ent.get(templateId) ?? 0) + 1);
  });

  return {
    byRelType: Array.from(rel.entries()).sort((a, b) => b[1] - a[1]),
    byEntityType: Array.from(ent.entries()).sort((a, b) => b[1] - a[1]),
    total: markers.length,
  };
};

export type { RelationshipsPanelFacetCounts };
export { computeFacetCounts };
