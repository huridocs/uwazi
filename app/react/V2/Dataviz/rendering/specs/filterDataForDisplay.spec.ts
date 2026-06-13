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
            points: [{ key: 'color-id', label: 'Red', labels: { en: 'Red', es: 'Rojo' }, value: 2 }],
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
});
