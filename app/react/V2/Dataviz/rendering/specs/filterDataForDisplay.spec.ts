import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import { filterDataForDisplay } from '../filterDataForDisplay.js';

describe('filterDataForDisplay', () => {
  const baseData = {
    datavizId: 'test',
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
    meta: { totalEntities: 3, truncated: false },
    series: [
      {
        id: 'main',
        label: 'Series',
        points: [
          { key: 'a', label: 'A', value: 2 },
          { key: DATAVIZ_MISSING_BUCKET_KEY, label: 'No data', value: 1 },
        ],
      },
    ],
  };

  it('should hide missing buckets by default', () => {
    const filtered = filterDataForDisplay(baseData, { type: 'bar' });
    expect(filtered.series[0]?.points).toEqual([{ key: 'a', label: 'A', value: 2 }]);
    expect(filtered.meta.totalEntities).toBe(2);
  });

  it('should show missing buckets when enabled', () => {
    const filtered = filterDataForDisplay(baseData, {
      type: 'bar',
      showMissingValues: true,
    });
    expect(filtered.series[0]?.points).toHaveLength(2);
    expect(filtered.meta.totalEntities).toBe(3);
  });

  it('should project localized labels for the active locale', () => {
    const filtered = filterDataForDisplay(
      {
        ...baseData,
        series: [
          {
            id: 'main',
            label: 'Red',
            labels: { en: 'Red', es: 'Rojo' },
            points: [
              { key: 'color-id', label: 'Red', labels: { en: 'Red', es: 'Rojo' }, value: 2 },
            ],
          },
        ],
      },
      { type: 'bar' },
      { locale: 'es', defaultLocale: 'en' }
    );

    expect(filtered.series[0]?.label).toBe('Rojo');
    expect(filtered.series[0]?.points[0]?.label).toBe('Rojo');
  });

  it('should apply custom missing label', () => {
    const filtered = filterDataForDisplay(baseData, {
      type: 'bar',
      showMissingValues: true,
      missingValueLabel: 'Sin datos',
    });
    expect(filtered.series[0]?.points[1]?.label).toBe('Sin datos');
  });

  it('should fill missing breakdown values as zero before applying excludeZero', () => {
    const filtered = filterDataForDisplay(
      {
        ...baseData,
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              {
                key: 'co',
                label: 'Colombia',
                value: 10,
                breakdown: [
                  { key: 'm', label: 'Hombre', value: 10 },
                  { key: 'f', label: 'Mujer', value: 0 },
                ],
              },
              {
                key: 'cl',
                label: 'Chile',
                value: 6,
                breakdown: [{ key: 'm', label: 'Hombre', value: 6 }],
              },
            ],
          },
        ],
      },
      { type: 'heatmap', excludeZero: false }
    );

    expect(filtered.series[0]?.points[1]?.breakdown).toEqual([
      { key: 'm', label: 'Hombre', value: 6 },
      { key: 'f', label: 'Mujer', value: 0 },
    ]);
  });

  it('should remove zero breakdown values when excludeZero is enabled', () => {
    const filtered = filterDataForDisplay(
      {
        ...baseData,
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              {
                key: 'co',
                label: 'Colombia',
                value: 10,
                breakdown: [
                  { key: 'm', label: 'Hombre', value: 10 },
                  { key: 'f', label: 'Mujer', value: 0 },
                ],
              },
            ],
          },
        ],
      },
      { type: 'heatmap', excludeZero: true }
    );

    expect(filtered.series[0]?.points[0]?.breakdown).toEqual([
      { key: 'm', label: 'Hombre', value: 10 },
    ]);
  });

  it('should not fill sparse breakdown matrix for scatter charts', () => {
    const crossTabData = {
      ...baseData,
      meta: { totalEntities: 2, truncated: false },
      series: [
        {
          id: 'main',
          label: 'Cars',
          points: [
            {
              key: 827017230,
              label: 'Mar 16, 1996',
              value: 1,
              breakdown: [{ key: 1, label: '1', value: 1 }],
            },
            {
              key: 835672919,
              label: 'Jun 25, 1996',
              value: 1,
              breakdown: [{ key: 1.6, label: '1.6', value: 1 }],
            },
          ],
        },
      ],
    };

    const scatterFiltered = filterDataForDisplay(crossTabData, { type: 'scatter' });
    const heatmapFiltered = filterDataForDisplay(crossTabData, {
      type: 'heatmap',
      excludeZero: false,
    });

    expect(scatterFiltered.series[0]?.points[0]?.breakdown).toEqual([
      { key: 1, label: '1', value: 1 },
    ]);
    expect(scatterFiltered.series[0]?.points[1]?.breakdown).toEqual([
      { key: 1.6, label: '1.6', value: 1 },
    ]);
    expect(heatmapFiltered.series[0]?.points[0]?.breakdown).toHaveLength(2);
    expect(heatmapFiltered.series[0]?.points[1]?.breakdown).toHaveLength(2);
  });

  it('should derive primary values for line charts with numeric cross-tab value measures', () => {
    const crossTabData = {
      ...baseData,
      meta: { totalEntities: 2, truncated: false },
      series: [
        {
          id: 'main',
          label: 'Cars',
          points: [
            {
              key: 827017230,
              label: 'Mar 16, 1996',
              value: 1,
              breakdown: [{ key: 1, label: '1', value: 1 }],
            },
            {
              key: 835672919,
              label: 'Jun 25, 1996',
              value: 1,
              breakdown: [{ key: 1.6, label: '1.6', value: 1 }],
            },
          ],
        },
      ],
    };

    const filtered = filterDataForDisplay(
      crossTabData,
      { type: 'line' },
      {
        dimensions: [
          { property: 'registration_date', propertyType: 'date' },
          { property: 'engine_size', propertyType: 'numeric' },
        ],
        measures: [{ aggregation: 'max' }],
      }
    );

    expect(filtered.series[0]?.points.map(point => point.value)).toEqual([1, 1.6]);
  });
});
