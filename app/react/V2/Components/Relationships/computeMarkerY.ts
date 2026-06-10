type MarkerMode = 'full' | 'page';

const TRACK = {
  full: { start: 0.08, range: 0.88 },
  page: { start: 0.18, range: 0.64 },
} as const;

const DEFAULT_PAGE_HEIGHT = 842;
const CLUSTER_BASE_SIZE = 16;
const CLUSTER_GROWTH_FACTOR = 3;
const CLUSTER_MAX_GROWTH = 16;

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

export { computeMarkerY, computeClusterOuterSize, normalizeTop, TRACK };
export type { MarkerMode, ComputeMarkerYInput };
