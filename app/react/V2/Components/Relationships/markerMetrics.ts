const RAIL_MARKER_SIZE = 10;
const RAIL_MARKER_ACTIVE_SIZE = 12;
const RAIL_MARKER_SPACING = 24;
const RAIL_MARKER_Z_STEP = 10;
const RAIL_MARKER_Z_CLUSTER_OFFSET = 5;
const RAIL_MARKER_Z_ACTIVE_OFFSET = 8;
const RAIL_MARKER_Z_OPEN_OFFSET = 1500;

type RailMarkerLayer = 'point' | 'point-active' | 'cluster' | 'cluster-open';

const RAIL_MARKER_Z_OFFSET: Record<RailMarkerLayer, number> = {
  point: 0,
  'point-active': RAIL_MARKER_Z_ACTIVE_OFFSET,
  cluster: RAIL_MARKER_Z_CLUSTER_OFFSET,
  'cluster-open': RAIL_MARKER_Z_OPEN_OFFSET,
};

const railMarkerZIndex = (stackOrder: number, layer: RailMarkerLayer): number =>
  stackOrder * RAIL_MARKER_Z_STEP + RAIL_MARKER_Z_OFFSET[layer];

export { RAIL_MARKER_SIZE, RAIL_MARKER_ACTIVE_SIZE, RAIL_MARKER_SPACING, railMarkerZIndex };
export type { RailMarkerLayer };
