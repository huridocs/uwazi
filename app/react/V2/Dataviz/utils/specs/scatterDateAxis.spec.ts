import {
  formatYearOnlyAxisTick,
  resolveScatterDateAxisMode,
  resolveScatterDateDimensionPatch,
  scatterDateKeyToAxisValue,
} from '../scatterDateAxis.js';

const yearDimension = {
  property: 'registration_date',
  propertyType: 'date' as const,
  bucketStrategy: 'date_histogram' as const,
  dateInterval: 'year' as const,
  sort: 'key_asc' as const,
  maxBuckets: 10,
};

const numericDimension = {
  property: 'engine_size',
  propertyType: 'numeric' as const,
  bucketStrategy: 'terms' as const,
  sort: 'key_asc' as const,
  maxBuckets: 10,
};

describe('scatterDateAxis helpers', () => {
  it('should convert unix seconds to fractional years for plotting', () => {
    expect(scatterDateKeyToAxisValue(946_684_800)).toBeCloseTo(2000, 0);
  });

  it('should keep calendar years as integers', () => {
    expect(scatterDateKeyToAxisValue(2000)).toBe(2000);
  });

  it('should hide non-integer year ticks', () => {
    expect(formatYearOnlyAxisTick(1995.28)).toBe('');
    expect(formatYearOnlyAxisTick(2000)).toBe('2000');
  });

  it('should map unix and calendar keys to year axis mode', () => {
    expect(resolveScatterDateAxisMode([946_684_800])).toBe('year');
    expect(resolveScatterDateAxisMode([2000, 2001])).toBe('year');
  });
});

describe('resolveScatterDateDimensionPatch', () => {
  it('should switch year date buckets to day precision for scatter', () => {
    const patch = resolveScatterDateDimensionPatch([yearDimension, numericDimension], 'scatter');

    expect(patch?.[0]).toEqual(
      expect.objectContaining({
        property: 'registration_date',
        dateInterval: 'day',
      })
    );
    expect(patch?.[1]).toEqual(numericDimension);
  });

  it('should not patch non-scatter charts', () => {
    expect(resolveScatterDateDimensionPatch([yearDimension], 'heatmap')).toBeNull();
  });

  it('should not patch when date is already daily', () => {
    expect(
      resolveScatterDateDimensionPatch([{ ...yearDimension, dateInterval: 'day' }], 'scatter')
    ).toBeNull();
  });

  it('should not patch computed years date buckets for scatter', () => {
    expect(
      resolveScatterDateDimensionPatch(
        [{ ...yearDimension, dateInterval: 'computed_years' }],
        'scatter'
      )
    ).toBeNull();
  });
});
