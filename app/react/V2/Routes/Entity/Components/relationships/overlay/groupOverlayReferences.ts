import type { OverlayReferenceDisplay } from './overlayReferenceDisplay.js';

type OverlayReferenceRow = {
  markerId: string;
  display: OverlayReferenceDisplay;
  relationshipTypeName: string;
};

type OverlayReferenceGroup = {
  sourceSharedId: string;
  sourceEntity: OverlayReferenceDisplay['sourceEntity'];
  items: OverlayReferenceRow[];
};

const OVERLAY_REFERENCES_VISIBLE_LIMIT = 10;

const groupOverlayReferences = (rows: OverlayReferenceRow[]): OverlayReferenceGroup[] => {
  const groups: OverlayReferenceGroup[] = [];
  const indexBySource = new Map<string, number>();

  rows.forEach(row => {
    const { sourceSharedId } = row.display;
    const existingIndex = indexBySource.get(sourceSharedId);
    if (existingIndex === undefined) {
      indexBySource.set(sourceSharedId, groups.length);
      groups.push({
        sourceSharedId,
        sourceEntity: row.display.sourceEntity,
        items: [row],
      });
      return;
    }
    groups[existingIndex].items.push(row);
  });

  return groups;
};

const limitReferenceGroups = (
  groups: OverlayReferenceGroup[],
  limit: number
): OverlayReferenceGroup[] => {
  let count = 0;
  const limited: OverlayReferenceGroup[] = [];

  groups.forEach(group => {
    if (count >= limit) return;
    const items = group.items.slice(0, limit - count);
    if (items.length === 0) return;
    limited.push({ ...group, items });
    count += items.length;
  });
  return limited;
};

const countReferenceItems = (groups: OverlayReferenceGroup[]) =>
  groups.reduce((total, group) => total + group.items.length, 0);

export type { OverlayReferenceGroup, OverlayReferenceRow };
export {
  OVERLAY_REFERENCES_VISIBLE_LIMIT,
  groupOverlayReferences,
  limitReferenceGroups,
  countReferenceItems,
};
