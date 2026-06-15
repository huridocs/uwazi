import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { directionOf, type RelationshipDirection } from './types.js';
import type { RelationshipAggregate } from './relationshipsPanelDerivation.js';
import {
  getGroupColor,
  getGroupLabel,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from './relationshipsPanelGrouping.js';

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

const aggregateKey = (marker: RelationshipMarker): string =>
  `${marker.target.sharedId}::${marker.view.type}`;

const deriveGraphAggregates = (
  markers: RelationshipMarker[],
  selfSharedId: string
): RelationshipAggregate[] => {
  const map = new Map<string, RelationshipAggregate>();
  for (const marker of markers) {
    const key = aggregateKey(marker);
    const direction = directionOf(marker.view, selfSharedId);
    const page = marker.anchor?.selections[0]?.page;
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
  return Array.from(map.values());
};

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

const buildGraphLayout = (
  markers: RelationshipMarker[],
  selfSharedId: string,
  groupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  activeRelationshipId?: string
): { spokes: GraphSpoke[]; nodes: GraphNode[] } => {
  const aggregates = deriveGraphAggregates(markers, selfSharedId);
  const byKey = new Map<string, RelationshipAggregate[]>();

  for (const aggregate of aggregates) {
    const key = groupBy === 'none' ? '' : aggregateGroupKey(aggregate, groupBy);
    const list = byKey.get(key) ?? [];
    list.push(aggregate);
    byKey.set(key, list);
  }

  const sorted = Array.from(byKey.entries()).sort(([a], [b]) => {
    const labelA =
      groupBy === 'none' ? 'Relationships' : getGroupLabel(a, groupBy, groupContext, markers);
    const labelB =
      groupBy === 'none' ? 'Relationships' : getGroupLabel(b, groupBy, groupContext, markers);
    return labelA.localeCompare(labelB);
  });

  const spokeCount = sorted.length;
  const nodes: GraphNode[] = [];
  const spokes: GraphSpoke[] = [];
  const sectorSpan = spokeCount === 1 ? Math.PI * 1.4 : (Math.PI * 2) / spokeCount - 0.12;

  sorted.forEach(([key, targets], index) => {
    const angle =
      spokeCount === 1 ? -Math.PI / 2 : (index / spokeCount) * Math.PI * 2 - Math.PI / 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const nodeIds: string[] = [];
    const sortedTargets = [...targets].sort((a, b) => b.markerIds.length - a.markerIds.length);

    let placed = 0;
    let ring = 0;
    while (placed < sortedTargets.length) {
      const radius = FIRST_RING_R + ring * RING_GAP;
      const capacity = Math.max(1, Math.floor((sectorSpan * radius) / ARC_GAP));
      const toPlace = Math.min(capacity, sortedTargets.length - placed);

      for (let j = 0; j < toPlace; j += 1) {
        const t = toPlace === 1 ? 0.5 : j / (toPlace - 1);
        const offset = (t - 0.5) * sectorSpan;
        const nodeAngle = angle + offset;
        const aggregate = sortedTargets[placed + j];
        if (aggregate) {
          const selected = aggregate.markerIds.includes(activeRelationshipId ?? '');
          const direction =
            aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');

          nodes.push({
            id: aggregate.id,
            title: aggregate.targetTitle,
            color: groupContext.templateColor(aggregate.targetTemplateId),
            typeName: groupContext.templateName(aggregate.targetTemplateId),
            evidenceCount: aggregate.markerIds.length,
            direction,
            markerIds: aggregate.markerIds,
            x: CX + Math.cos(nodeAngle) * radius,
            y: CY + Math.sin(nodeAngle) * radius,
            r: Math.min(8, 4 + Math.sqrt(aggregate.markerIds.length) * 1.1),
            selected,
          });
          nodeIds.push(aggregate.id);
        }
      }
      placed += toPlace;
      ring += 1;
    }

    spokes.push({
      key: key || 'all',
      label:
        groupBy === 'none' ? 'Relationships' : getGroupLabel(key, groupBy, groupContext, markers),
      color: groupBy === 'none' ? undefined : getGroupColor(key, groupBy, groupContext, markers),
      angle,
      labelX: CX + dirX * LABEL_DIST,
      labelY: CY + dirY * LABEL_DIST,
      nodeIds,
    });
  });

  return { spokes, nodes };
};

export type { GraphNode, GraphSpoke };
export { VIEW_W, VIEW_H, CX, CY, SOURCE_R, buildGraphLayout, deriveGraphAggregates };
