import { computePageClusterProximity } from '../computeClusterProximity.js';

describe('computePageClusterProximity', () => {
  it('maps track ratio to page pixels', () => {
    expect(computePageClusterProximity(900, 842)).toBe(46);
  });

  it('scales with track height once ratio exceeds floor', () => {
    const belowFloor = computePageClusterProximity(500, 842);
    const aboveFloor = computePageClusterProximity(1000, 842);
    expect(aboveFloor).toBeGreaterThan(belowFloor);
  });

  it('falls back to floor when dimensions are invalid', () => {
    expect(computePageClusterProximity(0, 842)).toBe(25);
    expect(computePageClusterProximity(500, 0)).toBe(25);
  });
});
