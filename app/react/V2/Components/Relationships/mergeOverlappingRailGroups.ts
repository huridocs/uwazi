import type { DocumentRelationshipGroup } from './groupDocumentRelationships.js';
import { computeFullRailMarkerLayout } from './computeMarkerY.js';
import { markerTop } from './types.js';

type PositionedRailGroup = {
  group: DocumentRelationshipGroup;
  y: number;
  size: number;
};

const positionRailGroup = (
  group: DocumentRelationshipGroup,
  layerHeight: number,
  totalPages: number
): PositionedRailGroup => {
  const { y, size } = computeFullRailMarkerLayout({
    layerHeight,
    page: group.page,
    top: markerTop(group.references[0]),
    totalPages,
    type: group.type,
    referenceCount: group.references.length,
  });
  return { group, y, size };
};

const centerY = (item: PositionedRailGroup): number => item.y + item.size / 2;

const overlaps = (a: PositionedRailGroup, b: PositionedRailGroup): boolean =>
  Math.abs(centerY(a) - centerY(b)) < (a.size + b.size) / 2;

const buildRuns = (positioned: PositionedRailGroup[]): PositionedRailGroup[][] =>
  positioned.reduce<PositionedRailGroup[][]>((runs, current) => {
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.some(member => overlaps(member, current))) {
      return [...runs.slice(0, -1), [...lastRun, current]];
    }
    return [...runs, [current]];
  }, []);

const mergeRailGroups = (items: PositionedRailGroup[]): DocumentRelationshipGroup => {
  const references = items.flatMap(item => item.group.references);
  const pages = items.flatMap(item => [item.group.startPage, item.group.endPage]);
  return {
    type: references.length > 1 ? 'cluster' : 'single',
    page: items[0].group.page,
    references,
    startPage: Math.min(...pages),
    endPage: Math.max(...pages),
  };
};

const refCount = (item: PositionedRailGroup): number => item.group.references.length;

const splitCandidate = (
  run: PositionedRailGroup[],
  index: number
): { gap: number; balance: number } => {
  const leftRefs = run.slice(0, index).reduce((sum, item) => sum + refCount(item), 0);
  const rightRefs = run.slice(index).reduce((sum, item) => sum + refCount(item), 0);
  return {
    gap: centerY(run[index]) - centerY(run[index - 1]),
    balance: Math.abs(leftRefs - rightRefs),
  };
};

const bipartitionSplitIndex = (run: PositionedRailGroup[]): number => {
  let splitIndex = 1;
  let largestGap = -Infinity;
  let bestBalance = Infinity;

  for (let index = 1; index < run.length; index += 1) {
    const { gap, balance } = splitCandidate(run, index);
    if (gap > largestGap || (gap === largestGap && balance < bestBalance)) {
      largestGap = gap;
      bestBalance = balance;
      splitIndex = index;
    }
  }

  return splitIndex;
};

const mergeRun = (run: PositionedRailGroup[]): DocumentRelationshipGroup[] => {
  if (run.length === 1) {
    return [run[0].group];
  }
  if (run.length === 2) {
    return [mergeRailGroups(run)];
  }
  const splitIndex = bipartitionSplitIndex(run);
  return [mergeRailGroups(run.slice(0, splitIndex)), mergeRailGroups(run.slice(splitIndex))];
};

const mergeOverlappingRailGroups = (
  groups: DocumentRelationshipGroup[],
  totalPages: number,
  markerLayerHeight: number
): DocumentRelationshipGroup[] => {
  if (markerLayerHeight <= 0 || groups.length <= 1) {
    return groups;
  }

  const positioned = groups
    .map(group => positionRailGroup(group, markerLayerHeight, totalPages))
    .sort((a, b) => a.y - b.y);

  return buildRuns(positioned).flatMap(mergeRun);
};

export { mergeOverlappingRailGroups };
