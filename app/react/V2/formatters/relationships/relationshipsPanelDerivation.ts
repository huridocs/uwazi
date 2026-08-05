import { RelationshipMarker, firstPageOf } from '#V2/Components/Relationships/types.js';
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

const compareEntries = (a: PanelListEntry, b: PanelListEntry): number => {
  const markerOf = (entry: PanelListEntry) =>
    entry.kind === 'reference' ? entry.marker : entry.markers[0];
  const left = markerOf(a);
  const right = markerOf(b);
  if (!left || !right) return 0;
  return compareAppearance(left, right);
};

const upsertHubMember = (
  members: Map<string, RelationshipHubMember>,
  marker: RelationshipMarker
): void => {
  const existing = members.get(marker.target.sharedId);
  if (existing) {
    existing.markerIds.push(marker._id);
    return;
  }
  members.set(marker.target.sharedId, {
    sharedId: marker.target.sharedId,
    title: marker.target.title,
    templateId: marker.target.templateId,
    markerIds: [marker._id],
  });
};

const deriveHub = (hubId: string, markers: RelationshipMarker[]): RelationshipHub => {
  const members = new Map<string, RelationshipHubMember>();
  let firstPage: number | undefined;
  const markerIds: string[] = [];

  for (const marker of markers) {
    markerIds.push(marker._id);
    const page = firstPageOf(marker);
    if (page !== undefined && (firstPage === undefined || page < firstPage)) firstPage = page;
    upsertHubMember(members, marker);
  }

  return {
    id: hubId,
    relationType: markers[0]?.view.type ?? '',
    members: Array.from(members.values()),
    firstPage,
    markerIds,
  };
};

const groupMarkersByHub = (markers: RelationshipMarker[]) => {
  const byHub = new Map<string, RelationshipMarker[]>();
  for (const marker of markers) {
    const hubId = marker.view.hub;
    const list = byHub.get(hubId) ?? [];
    list.push(marker);
    byHub.set(hubId, list);
  }
  return byHub;
};

const getNaryHubIds = (byHub: Map<string, RelationshipMarker[]>) =>
  new Set(
    Array.from(byHub.entries())
      .filter(([, hubMarkers]) => hubMarkers.length >= 2)
      .map(([hubId]) => hubId)
  );

const splitHubEntries = (byHub: Map<string, RelationshipMarker[]>, naryHubIds: Set<string>) => {
  const hubEntries: PanelListEntry[] = [];
  const remaining: RelationshipMarker[] = [];
  for (const [hubId, hubMarkers] of byHub.entries()) {
    if (naryHubIds.has(hubId)) {
      hubEntries.push({ kind: 'hub', hub: deriveHub(hubId, hubMarkers), markers: hubMarkers });
    } else {
      remaining.push(...hubMarkers);
    }
  }
  return { hubEntries, remaining };
};

const groupMarkersByAggregateKey = (markers: RelationshipMarker[]) => {
  const grouped = new Map<string, RelationshipMarker[]>();
  for (const marker of markers) {
    const key = aggregateKey(marker);
    const list = grouped.get(key) ?? [];
    list.push(marker);
    grouped.set(key, list);
  }
  return grouped;
};

const toOtherEntry = (
  key: string,
  groupMarkers: RelationshipMarker[],
  aggregates: Map<string, RelationshipAggregate>,
  collapseSingles: boolean
): PanelListEntry | undefined => {
  if (groupMarkers.length > 1 || collapseSingles) {
    const aggregate = aggregates.get(key);
    return aggregate ? { kind: 'aggregate', aggregate, markers: groupMarkers } : undefined;
  }
  const marker = groupMarkers[0];
  return marker ? { kind: 'reference', marker } : undefined;
};

const buildOtherEntries = (
  remaining: RelationshipMarker[],
  selfSharedId: string,
  collapseSingles: boolean
) => {
  const aggregates = deriveAggregates(remaining, selfSharedId);
  const grouped = groupMarkersByAggregateKey(remaining);
  const otherEntries: PanelListEntry[] = [];
  for (const [key, groupMarkers] of grouped.entries()) {
    const entry = toOtherEntry(key, groupMarkers, aggregates, collapseSingles);
    if (entry) otherEntries.push(entry);
  }
  return otherEntries;
};

const buildFlatPanelListEntries = (markers: RelationshipMarker[]): PanelListEntry[] =>
  markers.map(marker => ({ kind: 'reference', marker }));

type BuildPanelListEntriesOptions = {
  collapseSingles?: boolean;
};

const buildPanelListEntries = (
  markers: RelationshipMarker[],
  selfSharedId: string,
  options: BuildPanelListEntriesOptions = {}
): PanelListEntry[] => {
  const collapseSingles = options.collapseSingles ?? false;
  const byHub = groupMarkersByHub(markers);
  const { hubEntries, remaining } = splitHubEntries(byHub, getNaryHubIds(byHub));
  const otherEntries = buildOtherEntries(remaining, selfSharedId, collapseSingles);
  return [...hubEntries, ...otherEntries].sort(compareEntries);
};

const buildTreePanelListEntries = (
  markers: RelationshipMarker[],
  selfSharedId: string
): PanelListEntry[] => buildPanelListEntries(markers, selfSharedId, { collapseSingles: true });

const panelEntryKey = (entry: PanelListEntry): string => {
  if (entry.kind === 'reference') return entry.marker._id;
  if (entry.kind === 'aggregate') return entry.aggregate.id;
  return entry.hub.id;
};

export type { RelationshipAggregate, RelationshipHub, RelationshipHubMember, PanelListEntry };
export {
  buildFlatPanelListEntries,
  buildPanelListEntries,
  buildTreePanelListEntries,
  deriveHub,
  panelEntryKey,
};
