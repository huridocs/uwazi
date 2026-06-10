import { groupRelationships } from '../groupRelationships.js';
import {
  makeMarker,
  refPage1,
  refPage2,
  refPage3,
  refMultipleRectangles,
  refPage1Another,
  refNoRectangles,
} from './fixtures/groupRelationshipsFixtures.js';

describe('groupRelationships', () => {
  it('should cluster references that overlap or are close by proximity', () => {
    const closeToRefPage1 = makeMarker('ref-close', [
      { page: 1, top: 28, left: 15, width: 80, height: 20 },
    ]);

    const result = groupRelationships([refPage1, closeToRefPage1, refPage1Another]);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('cluster');
    if (result[0].type === 'cluster') {
      expect(result[0].references.map(reference => reference._id)).toEqual(['ref1', 'ref-close']);
    }

    expect(result[1].type).toBe('single');
    if (result[1].type === 'single') {
      expect(result[1].reference._id).toBe('ref4');
    }
  });

  it('should keep far references as singles', () => {
    const result = groupRelationships([refPage1, refPage1Another]);

    expect(result).toHaveLength(2);
    expect(result.every(group => group.type === 'single')).toBe(true);
  });

  it('should only use the first selection rectangle when calculating position', () => {
    const nearRef3ByFirstRectangle = makeMarker('ref-near-ref3', [
      { page: 1, top: 112, left: 10, width: 90, height: 20 },
      { page: 2, top: 12, left: 10, width: 90, height: 20 },
    ]);

    const result = groupRelationships([refMultipleRectangles, nearRef3ByFirstRectangle]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('cluster');
    if (result[0].type === 'cluster') {
      expect(result[0].references.map(reference => reference._id)).toEqual([
        'ref3',
        'ref-near-ref3',
      ]);
    }
  });

  it('should return an empty array for an empty references array', () => {
    expect(groupRelationships([])).toEqual([]);
  });

  it('should skip relationships with no text anchor', () => {
    const result = groupRelationships([refPage1, refNoRectangles, refPage3]);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('single');
    if (result[0].type === 'single') {
      expect(result[0].reference._id).toBe('ref1');
    }
    expect(result[1].type).toBe('single');
    if (result[1].type === 'single') {
      expect(result[1].reference._id).toBe('ref5');
    }
  });

  it('should use the fixed proximity threshold for grouping', () => {
    const withinProximityRef = makeMarker('within-proximity-ref', [
      { page: 2, top: 90, left: 10, width: 90, height: 20 },
    ]);
    const outsideProximityRef = makeMarker('outside-proximity-ref', [
      { page: 2, top: 106, left: 10, width: 90, height: 20 },
    ]);

    const clustered = groupRelationships([refPage2, withinProximityRef]);
    const separated = groupRelationships([refPage2, outsideProximityRef]);

    expect(clustered).toHaveLength(1);
    expect(clustered[0].type).toBe('cluster');
    expect(separated).toHaveLength(2);
    expect(separated.every(group => group.type === 'single')).toBe(true);
  });

  it('should not cluster references on different pages even if tops are close', () => {
    const refOnPage1 = makeMarker('ref-p1', [
      { page: 1, top: 50, left: 10, width: 100, height: 20 },
    ]);
    const refOnPage2 = makeMarker('ref-p2', [
      { page: 2, top: 50, left: 10, width: 100, height: 20 },
    ]);

    const result = groupRelationships([refOnPage1, refOnPage2]);

    expect(result).toHaveLength(2);
    expect(result.every(group => group.type === 'single')).toBe(true);
    expect(result[0].page).toBe('1');
    expect(result[1].page).toBe('2');
  });
});
