import { railMarkerZIndex } from '../markerMetrics.js';

describe('railMarkerZIndex', () => {
  it('keeps later rail markers above earlier clusters when they overlap', () => {
    const cluster = railMarkerZIndex(8, 'cluster');
    const point = railMarkerZIndex(9, 'point');

    expect(point).toBeGreaterThan(cluster);
  });

  it('keeps clusters above points at the same stack order', () => {
    const cluster = railMarkerZIndex(9, 'cluster');
    const point = railMarkerZIndex(9, 'point');

    expect(cluster).toBeGreaterThan(point);
  });
});
