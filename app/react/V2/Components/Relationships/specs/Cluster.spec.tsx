import { computeClusterSubtreeLayout } from '../Components/Cluster.js';
import { RAIL_MARKER_SIZE, RAIL_MARKER_SPACING } from '../markerMetrics.js';

describe('Cluster', () => {
  const rowCount = 11;
  const height = (rowCount - 1) * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE;

  it('centers the subtree when there is enough space', () => {
    const layout = computeClusterSubtreeLayout({
      position: 300,
      markerLayerHeight: 800,
      outerSize: 24,
      rowCount,
    });

    expect(layout.topOffset).toBe(12 - height / 2);
    expect(layout.stemY).toBe(height / 2);
  });

  it('connects to the first point when the subtree reaches the top edge', () => {
    const layout = computeClusterSubtreeLayout({
      position: 0,
      markerLayerHeight: 720,
      outerSize: 28,
      rowCount,
    });

    expect(layout.topOffset).toBe(0);
    expect(layout.stemY).toBe(RAIL_MARKER_SIZE / 2);
  });

  it('connects to the last point when the subtree reaches the bottom edge', () => {
    const layout = computeClusterSubtreeLayout({
      position: 706,
      markerLayerHeight: 720,
      outerSize: 28,
      rowCount,
    });

    expect(layout.topOffset).toBe(720 - height - 706);
    expect(layout.stemY).toBe(height - RAIL_MARKER_SIZE / 2);
  });
});
