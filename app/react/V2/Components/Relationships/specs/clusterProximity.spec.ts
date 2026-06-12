import { computePageClusterProximity } from '../clusterProximity.js';

describe('computePageClusterProximity', () => {
  it('maps track ratio to page pixels', () => {
    expect(computePageClusterProximity(900, 842)).toBe(46);
  });

  it('keeps page proximity constant once track ratio exceeds floor', () => {
    expect(computePageClusterProximity(900, 842)).toBe(46);
    expect(computePageClusterProximity(1000, 842)).toBe(46);
  });

  it('uses floor on short tracks, yielding larger page proximity', () => {
    expect(computePageClusterProximity(500, 842)).toBe(66);
    expect(computePageClusterProximity(500, 842)).toBeGreaterThan(
      computePageClusterProximity(900, 842)
    );
  });

  it('falls back to floor when dimensions are invalid', () => {
    expect(computePageClusterProximity(0, 842)).toBe(25);
    expect(computePageClusterProximity(500, 0)).toBe(25);
  });
});
