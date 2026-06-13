import {
  formatDatavizDateRangeLabel,
  formatDatavizDimensionKeyLabel,
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
} from '../formatDimensionKeyLabel.js';

describe('formatDimensionKeyLabel', () => {
  it('should format date range bucket keys', () => {
    const key = { from: 1651536000, to: 1651708799 };

    expect(formatDatavizDimensionKeyLabel(key, { propertyType: 'multidaterange' })).toBe(
      'May 3, 2022 ~ May 4, 2022'
    );
  });

  it('should format single date bucket keys', () => {
    expect(formatDatavizDimensionKeyLabel(1651536000, { propertyType: 'date' })).toBe(
      'May 3, 2022'
    );
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
});
