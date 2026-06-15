import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { compareAppearance } from './relationshipsPanelProjection.js';
import {
  aggregateKey,
  deriveAggregates,
  type RelationshipAggregate,
} from './relationshipsPanelAggregates.js';

type RelationshipHubMember = {
  sharedId: string;
  title: string;
  templateId: string;
  markerIds: string[];
};

type RelationshipHub = {
  id: string;
  relationType: string;
  members: RelationshipHubMember[];
  firstPage?: number;
  markerIds: string[];
};

type PanelListEntry =
  | { kind: 'reference'; marker: RelationshipMarker }
  | { kind: 'aggregate'; aggregate: RelationshipAggregate; markers: RelationshipMarker[] }
  | { kind: 'hub'; hub: RelationshipHub; markers: RelationshipMarker[] };

const firstPageOf = (marker: RelationshipMarker): number | undefined =>
  marker.anchor?.selections[0]?.page;

const compareEntries = (a: PanelListEntry, b: PanelListEntry): number => {
  const markerOf = (entry: PanelListEntry) =>
    entry.kind === 'reference' ? entry.marker : entry.markers[0];
  const left = markerOf(a);
  const right = markerOf(b);
  if (!left || !right) return 0;
  return compareAppearance(left, right);
};

const deriveHub = (hubId: string, markers: RelationshipMarker[]): RelationshipHub => {
  const members = new Map<string, RelationshipHubMember>();
  let firstPage: number | undefined;
  const markerIds: string[] = [];

  for (const marker of markers) {
    markerIds.push(marker._id);
    const page = firstPageOf(marker);
    if (page !== undefined && (firstPage === undefined || page < firstPage)) firstPage = page;

    const member = members.get(marker.target.sharedId);
    if (member) {
      member.markerIds.push(marker._id);
    } else {
      members.set(marker.target.sharedId, {
        sharedId: marker.target.sharedId,
        title: marker.target.title,
        templateId: marker.target.templateId,
        markerIds: [marker._id],
      });
    }
  }

  return {
    id: hubId,
    relationType: markers[0]?.view.type ?? '',
    members: Array.from(members.values()),
    firstPage,
    markerIds,
  };
};

const buildPanelListEntries = (
  markers: RelationshipMarker[],
  selfSharedId: string
): PanelListEntry[] => {
  const byHub = new Map<string, RelationshipMarker[]>();
  for (const marker of markers) {
    const hubId = marker.view.hub;
    const list = byHub.get(hubId) ?? [];
    list.push(marker);
    byHub.set(hubId, list);
  }

  const naryHubIds = new Set(
    Array.from(byHub.entries())
      .filter(([, hubMarkers]) => hubMarkers.length >= 2)
      .map(([hubId]) => hubId)
  );

  const hubEntries: PanelListEntry[] = [];
  const remaining: RelationshipMarker[] = [];

  for (const [hubId, hubMarkers] of byHub.entries()) {
    if (naryHubIds.has(hubId)) {
      hubEntries.push({
        kind: 'hub',
        hub: deriveHub(hubId, hubMarkers),
        markers: hubMarkers,
      });
    } else {
      remaining.push(...hubMarkers);
    }
  }

  const aggregates = deriveAggregates(remaining, selfSharedId);
  const grouped = new Map<string, RelationshipMarker[]>();
  for (const marker of remaining) {
    const key = aggregateKey(marker);
    const list = grouped.get(key) ?? [];
    list.push(marker);
    grouped.set(key, list);
  }

  const otherEntries: PanelListEntry[] = [];
  for (const [key, groupMarkers] of grouped.entries()) {
    if (groupMarkers.length > 1) {
      const aggregate = aggregates.get(key);
      if (aggregate) {
        otherEntries.push({ kind: 'aggregate', aggregate, markers: groupMarkers });
      }
    } else {
      const marker = groupMarkers[0];
      if (marker) otherEntries.push({ kind: 'reference', marker });
    }
  }

  return [...hubEntries, ...otherEntries].sort(compareEntries);
};

const panelEntryKey = (entry: PanelListEntry): string => {
  if (entry.kind === 'reference') return entry.marker._id;
  if (entry.kind === 'aggregate') return entry.aggregate.id;
  return entry.hub.id;
};

export type { RelationshipAggregate, RelationshipHub, RelationshipHubMember, PanelListEntry };
export { buildPanelListEntries, deriveHub, panelEntryKey };
