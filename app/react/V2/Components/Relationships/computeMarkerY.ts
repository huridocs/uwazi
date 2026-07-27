import { RAIL_MARKER_SIZE } from './markerMetrics.js';

type MarkerMode = 'full' | 'page';

const TRACK = {
  full: { start: 0.08, range: 0.88 },
  page: { start: 0.18, range: 0.64 },
} as const;

const DEFAULT_PAGE_HEIGHT = 842;
const CLUSTER_BASE_SIZE = 14;
const CLUSTER_GROWTH_FACTOR = 3;
const CLUSTER_MAX_GROWTH = 12;

const normalizeTop = (top: number, pageHeight?: number): number => {
  if (top <= 1) {
    return top;
  }
  const height = pageHeight && pageHeight > 0 ? pageHeight : DEFAULT_PAGE_HEIGHT;
  return top / height;
};

type ComputeMarkerYInput = {
  mode: MarkerMode;
  layerHeight: number;
  page: number;
  top: number;
  totalPages: number;
  markerSize: number;
  pageHeight?: number;
};

const computeMarkerY = ({
  mode,
  layerHeight,
  page,
  top,
  totalPages,
  markerSize,
  pageHeight,
}: ComputeMarkerYInput): number => {
  const normalizedTop = normalizeTop(top, pageHeight);
  const safePages = Math.max(totalPages, 1);

  const yFraction = mode === 'full' ? (page - 1 + normalizedTop) / safePages : normalizedTop;

  const { start, range } = TRACK[mode];
  return layerHeight * (start + yFraction * range) - markerSize / 2;
};

const computeClusterOuterSize = (count: number): number =>
  CLUSTER_BASE_SIZE + Math.min(Math.sqrt(count) * CLUSTER_GROWTH_FACTOR, CLUSTER_MAX_GROWTH);

const resolveFullRailMarkerSize = (type: 'cluster' | 'single', referenceCount: number): number =>
  type === 'cluster' ? computeClusterOuterSize(referenceCount) : RAIL_MARKER_SIZE;

type FullRailMarkerLayoutInput = {
  layerHeight: number;
  page: number;
  top: number;
  totalPages: number;
  type: 'cluster' | 'single';
  referenceCount: number;
};

const computeFullRailMarkerLayout = ({
  layerHeight,
  page,
  top,
  totalPages,
  type,
  referenceCount,
}: FullRailMarkerLayoutInput): { y: number; size: number } => {
  const size = resolveFullRailMarkerSize(type, referenceCount);
  const y = computeMarkerY({
    mode: 'full',
    layerHeight,
    page,
    top,
    totalPages,
    markerSize: size,
  });
  return { y, size };
};

export {
  computeMarkerY,
  computeClusterOuterSize,
  computeFullRailMarkerLayout,
  normalizeTop,
  TRACK,
};
export type { MarkerMode, ComputeMarkerYInput, FullRailMarkerLayoutInput };
