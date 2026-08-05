import {
  computeMarkerY,
  computeClusterOuterSize,
  computeFullRailMarkerLayout,
  normalizeTop,
} from '../computeMarkerY.js';
import { RAIL_MARKER_SIZE } from '../markerMetrics.js';

describe('computeMarkerY', () => {
  describe('marker placement', () => {
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

  describe('computeFullRailMarkerLayout', () => {
    it('returns CSS top and size matching computeMarkerY for singles', () => {
      const layout = computeFullRailMarkerLayout({
        layerHeight: 500,
        page: 2,
        top: 0.25,
        totalPages: 10,
        type: 'single',
        referenceCount: 1,
      });

      expect(layout.size).toBe(RAIL_MARKER_SIZE);
      expect(layout.y).toBe(
        computeMarkerY({
          mode: 'full',
          layerHeight: 500,
          page: 2,
          top: 0.25,
          totalPages: 10,
          markerSize: RAIL_MARKER_SIZE,
        })
      );
    });

    it('uses cluster outer size for clusters', () => {
      const layout = computeFullRailMarkerLayout({
        layerHeight: 500,
        page: 1,
        top: 0,
        totalPages: 10,
        type: 'cluster',
        referenceCount: 9,
      });

      expect(layout.size).toBe(computeClusterOuterSize(9));
    });
  });
});
