import { computeMarkerY, computeClusterOuterSize, normalizeTop } from '../computeMarkerY.js';

describe('computeMarkerY', () => {
  it('should place full mode markers using page and top fraction', () => {
    const topA = computeMarkerY({
      mode: 'full',
      layerHeight: 500,
      page: 1,
      top: 100,
      totalPages: 10,
      markerSize: 10,
      pageHeight: 1000,
    });
    const topB = computeMarkerY({
      mode: 'full',
      layerHeight: 500,
      page: 1,
      top: 500,
      totalPages: 10,
      markerSize: 10,
      pageHeight: 1000,
    });

    expect(topB).toBeGreaterThan(topA);
  });

  it('should place page mode markers within the page track range', () => {
    const top = computeMarkerY({
      mode: 'page',
      layerHeight: 400,
      page: 1,
      top: 0,
      totalPages: 1,
      markerSize: 24,
      pageHeight: 800,
    });

    expect(top).toBeCloseTo(400 * 0.18 - 12, 0);
  });
});

describe('normalizeTop', () => {
  it('should treat values above 1 as pixel offsets', () => {
    expect(normalizeTop(400, 800)).toBe(0.5);
  });
});

describe('computeClusterOuterSize', () => {
  it('should grow with reference count', () => {
    expect(computeClusterOuterSize(25)).toBeGreaterThan(computeClusterOuterSize(3));
  });
});
