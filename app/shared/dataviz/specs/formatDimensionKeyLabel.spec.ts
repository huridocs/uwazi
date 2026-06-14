import {
  formatDatavizDateRangeLabel,
  formatDatavizDimensionKeyLabel,
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
  compareDatavizBucketKeys,
} from '../formatDimensionKeyLabel.js';

describe('formatDimensionKeyLabel', () => {
  it('should format date range bucket keys', () => {
    const key = { from: 1651536000, to: 1651708799 };

    expect(formatDatavizDimensionKeyLabel(key, { propertyType: 'multidaterange' })).toBe(
      'May 3, 2022 ~ May 4, 2022'
    );
  });

  it('should format year bucket keys for date dimensions by default', () => {
    expect(formatDatavizDimensionKeyLabel(2022, { propertyType: 'date' })).toBe('2022');
  });

  it('should format single date bucket keys with day interval', () => {
    expect(
      formatDatavizDimensionKeyLabel(1651536000, { propertyType: 'date', dateInterval: 'day' })
    ).toBe('May 3, 2022');
  });

  it('should normalize serialized date range keys after union merge', () => {
    const serialized = serializeDatavizBucketKey({ from: 1651536000, to: 1651708799 });

    expect(normalizeDatavizBucketKey(serialized)).toEqual({
      from: 1651536000,
      to: 1651708799,
    });
    expect(
      formatDatavizDimensionKeyLabel(serialized, { propertyType: 'multidaterange' })
    ).toBe('May 3, 2022 ~ May 4, 2022');
  });

  it('should format date ranges using the Uwazi tilde separator', () => {
    expect(formatDatavizDateRangeLabel({ from: 315532800, to: 504835200 })).toBe(
      'Jan 1, 1980 ~ Dec 31, 1985'
    );
  });

  it('should compare numeric bucket keys in ascending order', () => {
    expect(
      [2005, 1999, 2003, 2025].sort((a, b) => compareDatavizBucketKeys(a, b))
    ).toEqual([1999, 2003, 2005, 2025]);
  });

  it('should format numeric bucket keys without floating-point noise', () => {
    expect(formatDatavizDimensionKeyLabel(1.7999999999999998, { propertyType: 'numeric' })).toBe(
      '1.8'
    );
    expect(formatDatavizDimensionKeyLabel(2, { propertyType: 'numeric' })).toBe('2');
  });
});
