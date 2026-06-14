import {
  DATAVIZ_MISSING_BUCKET_KEY,
  DATAVIZ_MISSING_BUCKET_LABEL,
} from '#shared/dataviz/missingBucket.js';
import { normalizeBuckets, normalizeCompareSeries } from '../DatavizResultNormalizer.js';

const missingBucketLabels = { en: DATAVIZ_MISSING_BUCKET_LABEL };

const resolveLabel = (_dim: { property: string; propertyType: string }, key: unknown) => ({
  en: String(key),
});

describe('normalizeBuckets', () => {
  it('should label missing buckets as no data', () => {
    const dto = normalizeBuckets({
      buckets: [{ _id: null, count: 3 }],
      primaryDim: { property: 'sexo', propertyType: 'select' },
      resolveLabel,
      datavizId: 'test',
      queryDurationMs: 1,
      defaultLanguage: 'en',
      missingBucketLabels,
    });

    expect(dto.series[0]?.points[0]).toEqual({
      key: DATAVIZ_MISSING_BUCKET_KEY,
      label: DATAVIZ_MISSING_BUCKET_LABEL,
      labels: missingBucketLabels,
      value: 3,
    });
    expect(dto.meta.totalEntities).toBe(3);
  });

  it('should include missing buckets in totals', () => {
    const dto = normalizeBuckets({
      buckets: [
        { _id: 'hombre', count: 5 },
        { _id: null, count: 3 },
      ],
      primaryDim: { property: 'sexo', propertyType: 'select' },
      resolveLabel,
      datavizId: 'test',
      queryDurationMs: 1,
      defaultLanguage: 'en',
      missingBucketLabels,
    });

    expect(dto.series[0]?.points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'hombre', value: 5, labels: { en: 'hombre' } }),
        expect.objectContaining({ key: DATAVIZ_MISSING_BUCKET_KEY, value: 3 }),
      ])
    );
    expect(dto.meta.totalEntities).toBe(8);
  });

  it('should sort primary buckets by numeric key when sort is key_asc', () => {
    const dto = normalizeBuckets({
      buckets: [
        { _id: 2005, count: 1 },
        { _id: 1999, count: 3 },
        { _id: 2003, count: 2 },
      ],
      primaryDim: { property: 'year', propertyType: 'date', sort: 'key_asc' },
      resolveLabel,
      datavizId: 'test',
      queryDurationMs: 1,
      defaultLanguage: 'en',
      missingBucketLabels,
    });

    expect(dto.series[0]?.points.map(point => point.key)).toEqual([1999, 2003, 2005]);
  });

  it('should limit primary and secondary buckets independently for two dimensions', () => {
    const buckets = [
      ...Array.from({ length: 9 }, (_, i) => ({
        _id: { primary: 'hombre', secondary: `country-${i}` },
        count: 10 - i,
      })),
      { _id: { primary: 'mujer', secondary: 'country-0' }, count: 5 },
      { _id: { primary: 'mujer', secondary: 'country-1' }, count: 4 },
    ];

    const dto = normalizeBuckets({
      buckets,
      primaryDim: { property: 'sexo', propertyType: 'select', maxBuckets: 10, sort: 'count_desc' },
      secondaryDim: {
        property: 'pais',
        propertyType: 'select',
        relationshipMode: 'related_entity',
        maxBuckets: 3,
        sort: 'count_desc',
      },
      resolveLabel,
      datavizId: 'test',
      queryDurationMs: 1,
      defaultLanguage: 'en',
      missingBucketLabels,
    });

    expect(dto.meta.totalEntities).toBe(63);
    expect(dto.meta.truncated).toBe(true);
    expect(dto.series[0]?.points.map(p => p.key)).toEqual(
      expect.arrayContaining(['hombre', 'mujer'])
    );

    const mujer = dto.series[0]?.points.find(p => p.key === 'mujer');
    expect(mujer?.value).toBe(9);
    expect(mujer?.breakdown).toHaveLength(2);

    const hombre = dto.series[0]?.points.find(p => p.key === 'hombre');
    expect(hombre?.breakdown).toHaveLength(3);
  });

  it('should return one series per source in compare mode', () => {
    const dto = normalizeCompareSeries({
      bucketSets: [
        [
          { _id: 'a', count: 2 },
          { _id: 'b', count: 1 },
        ],
        [
          { _id: 'a', count: 1 },
          { _id: 'c', count: 3 },
        ],
      ],
      sourceIds: ['hombres', 'mujeres'],
      sourceLabels: ['Hombres', 'Mujeres'],
      sourceLocalizedLabels: [{ en: 'Hombres' }, { en: 'Mujeres' }],
      primaryDim: { property: 'mandatos', propertyType: 'multidaterange' },
      resolveLabel,
      datavizId: 'test',
      queryDurationMs: 5,
      defaultLanguage: 'en',
      missingBucketLabels,
    });

    expect(dto.series).toHaveLength(2);
    expect(dto.series[0]?.label).toBe('Hombres');
    expect(dto.series[0]?.labels).toEqual({ en: 'Hombres' });
    expect(dto.series[1]?.label).toBe('Mujeres');
    expect(dto.meta.totalEntities).toBe(7);
  });
});
