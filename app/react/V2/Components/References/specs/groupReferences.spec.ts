import { groupReferences } from '../groupReferences.js';
import {
  refPage1,
  refPage2,
  refPage3,
  refMultipleRectangles,
  refPage1Another,
  refNoRectangles,
} from './fixtures/groupReferencesFixtures.js';

describe('groupReferences', () => {
  it('should cluster references that overlap or are close by proximity', () => {
    const closeToRefPage1 = {
      ...refPage2,
      _id: 'ref-close',
      reference: {
        ...refPage2.reference,
        selectionRectangles: [{ top: 28, left: 15, width: 80, height: 20, page: '1' }],
      },
    };

    const references = [refPage1, closeToRefPage1, refPage1Another];
    const result = groupReferences(references);

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
    const references = [refPage1, refPage1Another];
    const result = groupReferences(references);

    expect(result).toHaveLength(2);
    expect(result.every(group => group.type === 'single')).toBe(true);
  });

  it('should only use the first selection rectangle when calculating position', () => {
    const nearRef3ByFirstRectangle = {
      ...refPage2,
      _id: 'ref-near-ref3',
      reference: {
        ...refPage2.reference,
        selectionRectangles: [
          { top: 112, left: 10, width: 90, height: 20, page: '1' },
          { top: 12, left: 10, width: 90, height: 20, page: '2' },
        ],
      },
    };

    const result = groupReferences([refMultipleRectangles, nearRef3ByFirstRectangle]);

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
    const result = groupReferences([]);

    expect(result).toEqual([]);
  });

  it('should handle references with no selection rectangles by skipping them', () => {
    const references = [refPage1, refNoRectangles, refPage3];
    const result = groupReferences(references);

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
    const withinProximityRef = {
      ...refPage2,
      _id: 'within-proximity-ref',
      reference: {
        ...refPage2.reference,
        selectionRectangles: [{ top: 90, left: 10, width: 90, height: 20, page: '2' }],
      },
    };

    const outsideProximityRef = {
      ...refPage2,
      _id: 'outside-proximity-ref',
      reference: {
        ...refPage2.reference,
        selectionRectangles: [{ top: 106, left: 10, width: 90, height: 20, page: '2' }],
      },
    };

    const clustered = groupReferences([refPage2, withinProximityRef]);
    const separated = groupReferences([refPage2, outsideProximityRef]);

    expect(clustered).toHaveLength(1);
    expect(clustered[0].type).toBe('cluster');
    expect(separated).toHaveLength(2);
    expect(separated.every(group => group.type === 'single')).toBe(true);
  });

  it('should not cluster references on different pages even if tops are close', () => {
    const refOnPage1 = {
      ...refPage1,
      _id: 'ref-p1',
      reference: {
        ...refPage1.reference,
        selectionRectangles: [{ top: 50, left: 10, width: 100, height: 20, page: '1' }],
      },
    };

    const refOnPage2 = {
      ...refPage2,
      _id: 'ref-p2',
      reference: {
        ...refPage2.reference,
        selectionRectangles: [{ top: 50, left: 10, width: 100, height: 20, page: '2' }],
      },
    };

    const result = groupReferences([refOnPage1, refOnPage2]);

    expect(result).toHaveLength(2);
    expect(result.every(group => group.type === 'single')).toBe(true);
    expect(result[0].page).toBe('1');
    expect(result[1].page).toBe('2');
  });
});
