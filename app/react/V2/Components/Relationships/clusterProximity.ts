import { TRACK } from './computeMarkerY.js';

const PAGE_CLUSTER_PROXIMITY_FLOOR = 25;
const TRACK_CLUSTER_RATIO = 0.035;

const computePageClusterProximity = (trackHeight: number, pageHeight: number): number => {
  const trackProximity = Math.max(PAGE_CLUSTER_PROXIMITY_FLOOR, trackHeight * TRACK_CLUSTER_RATIO);
  const trackRangePx = trackHeight * TRACK.page.range;

  if (trackRangePx <= 0 || pageHeight <= 0) {
    return PAGE_CLUSTER_PROXIMITY_FLOOR;
  }

  return Math.round((trackProximity / trackRangePx) * pageHeight);
};

export { TRACK_CLUSTER_RATIO, PAGE_CLUSTER_PROXIMITY_FLOOR, computePageClusterProximity };
