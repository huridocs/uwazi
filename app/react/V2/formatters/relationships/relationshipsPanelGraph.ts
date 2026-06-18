import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { RelationshipAggregate } from './relationshipsPanelAggregates.js';
import { listAggregates } from './relationshipsPanelAggregates.js';
import type { RelationshipDirection } from './types.js';
import {
  getGroupColor,
  getGroupLabel,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from './relationshipsPanelGrouping.js';

/* eslint-disable max-lines */

type GraphNode = {
  id: string;
  title: string;
  color?: string;
  typeName: string;
  evidenceCount: number;
  direction: RelationshipDirection;
  markerIds: string[];
  x: number;
  y: number;
  r: number;
  selected: boolean;
};

type GraphSpoke = {
  key: string;
  label: string;
  color?: string;
  angle: number;
  labelX: number;
  labelY: number;
  nodeIds: string[];
};

const VIEW_W = 900;
const VIEW_H = 700;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const SOURCE_R = 22;
const LABEL_DIST = 72;
const FIRST_RING_R = 140;
const RING_GAP = 36;
const ARC_GAP = 28;

const aggregateGroupKey = (
  aggregate: RelationshipAggregate,
  groupBy: RelationshipsPanelGroupBy
): string => {
  switch (groupBy) {
    case 'target-template':
      return aggregate.targetTemplateId || 'unknown';
    case 'target-entity':
      return aggregate.targetSharedId;
    case 'relation-type':
      return aggregate.relationType || 'no_label';
    case 'direction':
      return aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');
    case 'source-page':
      return aggregate.firstPage === undefined ? 'no-page' : String(aggregate.firstPage);
    case 'source-template':
    case 'source-entity':
    case 'none':
    default:
      return '';
  }
};

const groupAggregatesByKey = (
  aggregates: RelationshipAggregate[],
  groupBy: RelationshipsPanelGroupBy
): Map<string, RelationshipAggregate[]> => {
  const byKey = new Map<string, RelationshipAggregate[]>();
  for (const aggregate of aggregates) {
    const key = groupBy === 'none' ? '' : aggregateGroupKey(aggregate, groupBy);
    const list = byKey.get(key) ?? [];
    list.push(aggregate);
    byKey.set(key, list);
  }
  return byKey;
};

const groupLabel = (
  key: string,
  groupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  markers: RelationshipMarker[]
): string =>
  groupBy === 'none' ? 'Relationships' : getGroupLabel(key, groupBy, groupContext, markers);

const sortAggregateGroups = (
  byKey: Map<string, RelationshipAggregate[]>,
  groupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  markers: RelationshipMarker[]
): [string, RelationshipAggregate[]][] =>
  Array.from(byKey.entries()).sort(([a], [b]) =>
    groupLabel(a, groupBy, groupContext, markers).localeCompare(
      groupLabel(b, groupBy, groupContext, markers)
    )
  );

type NodeLayoutContext = {
  groupContext: GroupLabelContext;
  activeRelationshipId?: string;
};

const graphNodeFromAggregate = (
  aggregate: RelationshipAggregate,
  nodeAngle: number,
  radius: number,
  context: NodeLayoutContext
): GraphNode => {
  const selected = aggregate.markerIds.includes(context.activeRelationshipId ?? '');
  const direction =
    aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');
  return {
    id: aggregate.id,
    title: aggregate.targetTitle,
    color: context.groupContext.templateColor(aggregate.targetTemplateId),
    typeName: context.groupContext.templateName(aggregate.targetTemplateId),
    evidenceCount: aggregate.markerIds.length,
    direction,
    markerIds: aggregate.markerIds,
    x: CX + Math.cos(nodeAngle) * radius,
    y: CY + Math.sin(nodeAngle) * radius,
    r: Math.min(8, 4 + Math.sqrt(aggregate.markerIds.length) * 1.1),
    selected,
  };
};

type RingPlacementInput = {
  angle: number;
  sectorSpan: number;
  radius: number;
  sortedTargets: RelationshipAggregate[];
  startIndex: number;
  count: number;
  context: NodeLayoutContext;
};

const placeRingNodes = ({
  angle,
  sectorSpan,
  radius,
  sortedTargets,
  startIndex,
  count,
  context,
}: RingPlacementInput): { nodes: GraphNode[]; nodeIds: string[] } => {
  const nodes: GraphNode[] = [];
  const nodeIds: string[] = [];
  for (let j = 0; j < count; j += 1) {
    const t = count === 1 ? 0.5 : j / (count - 1);
    const nodeAngle = angle + (t - 0.5) * sectorSpan;
    const aggregate = sortedTargets[startIndex + j];
    if (aggregate) {
      nodes.push(graphNodeFromAggregate(aggregate, nodeAngle, radius, context));
      nodeIds.push(aggregate.id);
    }
  }
  return { nodes, nodeIds };
};

const processRing = (input: {
  angle: number;
  sectorSpan: number;
  sortedTargets: RelationshipAggregate[];
  placed: number;
  ring: number;
  context: NodeLayoutContext;
}): { nodes: GraphNode[]; nodeIds: string[]; placed: number; ring: number } => {
  const { angle, sectorSpan, sortedTargets, placed, ring, context } = input;
  const radius = FIRST_RING_R + ring * RING_GAP;
  const capacity = Math.max(1, Math.floor((sectorSpan * radius) / ARC_GAP));
  const toPlace = Math.min(capacity, sortedTargets.length - placed);
  const ringLayout = placeRingNodes({
    angle,
    sectorSpan,
    radius,
    sortedTargets,
    startIndex: placed,
    count: toPlace,
    context,
  });
  return {
    nodes: ringLayout.nodes,
    nodeIds: ringLayout.nodeIds,
    placed: placed + toPlace,
    ring: ring + 1,
  };
};

const advanceSpokeLayout = (input: {
  acc: { nodes: GraphNode[]; nodeIds: string[]; placed: number; ring: number };
  angle: number;
  sectorSpan: number;
  sortedTargets: RelationshipAggregate[];
  context: NodeLayoutContext;
}): void => {
  const { acc, angle, sectorSpan, sortedTargets, context } = input;
  const next = processRing({
    angle,
    sectorSpan,
    sortedTargets,
    placed: acc.placed,
    ring: acc.ring,
    context,
  });
  acc.nodes.push(...next.nodes);
  acc.nodeIds.push(...next.nodeIds);
  acc.placed = next.placed;
  acc.ring = next.ring;
};

const fillSpokeRings = (
  angle: number,
  sectorSpan: number,
  sortedTargets: RelationshipAggregate[],
  context: NodeLayoutContext
): { nodes: GraphNode[]; nodeIds: string[] } => {
  const acc = { nodes: [] as GraphNode[], nodeIds: [] as string[], placed: 0, ring: 0 };
  while (acc.placed < sortedTargets.length) {
    advanceSpokeLayout({ acc, angle, sectorSpan, sortedTargets, context });
  }
  return { nodes: acc.nodes, nodeIds: acc.nodeIds };
};

const placeSpokeNodes = (
  angle: number,
  sectorSpan: number,
  targets: RelationshipAggregate[],
  context: NodeLayoutContext
): { nodes: GraphNode[]; nodeIds: string[] } =>
  fillSpokeRings(
    angle,
    sectorSpan,
    [...targets].sort((a, b) => b.markerIds.length - a.markerIds.length),
    context
  );

type SpokeLayoutInput = {
  key: string;
  targets: RelationshipAggregate[];
  index: number;
  spokeCount: number;
  sectorSpan: number;
  groupBy: RelationshipsPanelGroupBy;
  groupContext: GroupLabelContext;
  markers: RelationshipMarker[];
  activeRelationshipId?: string;
};

const buildSpoke = ({
  key,
  targets,
  index,
  spokeCount,
  sectorSpan,
  groupBy,
  groupContext,
  markers,
  activeRelationshipId,
}: SpokeLayoutInput): { spoke: GraphSpoke; nodes: GraphNode[] } => {
  const angle = spokeCount === 1 ? -Math.PI / 2 : (index / spokeCount) * Math.PI * 2 - Math.PI / 2;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const { nodes, nodeIds } = placeSpokeNodes(angle, sectorSpan, targets, {
    groupContext,
    activeRelationshipId,
  });

  return {
    nodes,
    spoke: {
      key: key || 'all',
      label: groupLabel(key, groupBy, groupContext, markers),
      color: groupBy === 'none' ? undefined : getGroupColor(key, groupBy, groupContext, markers),
      angle,
      labelX: CX + dirX * LABEL_DIST,
      labelY: CY + dirY * LABEL_DIST,
      nodeIds,
    },
  };
};

const buildGraphLayout = (
  markers: RelationshipMarker[],
  groupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  activeRelationshipId?: string
): { spokes: GraphSpoke[]; nodes: GraphNode[] } => {
  const aggregates = listAggregates(markers, groupContext.selfSharedId);
  const sorted = sortAggregateGroups(
    groupAggregatesByKey(aggregates, groupBy),
    groupBy,
    groupContext,
    markers
  );
  const spokeCount = sorted.length;
  const sectorSpan = spokeCount === 1 ? Math.PI * 1.4 : (Math.PI * 2) / spokeCount - 0.12;
  const nodes: GraphNode[] = [];
  const spokes: GraphSpoke[] = [];

  sorted.forEach(([key, targets], index) => {
    const layout = buildSpoke({
      key,
      targets,
      index,
      spokeCount,
      sectorSpan,
      groupBy,
      groupContext,
      markers,
      activeRelationshipId,
    });
    nodes.push(...layout.nodes);
    spokes.push(layout.spoke);
  });

  return { spokes, nodes };
};

export type { GraphNode, GraphSpoke };
export { VIEW_W, VIEW_H, CX, CY, SOURCE_R, buildGraphLayout };
