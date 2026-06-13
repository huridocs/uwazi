import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { alignMultiSeriesForChart } from '../alignMultiSeriesForChart.js';

describe('alignMultiSeriesForChart', () => {
  it('should align categories across compare series', () => {
    const dto: DatavizDataDTO = {
      datavizId: 'test',
      generatedAt: '2026-01-01T00:00:00.000Z',
      stale: false,
      meta: { totalEntities: 6, truncated: false },
      series: [
        {
          id: 'hombres',
          label: 'Hombres',
          points: [
            { key: 'a', label: 'Bucket A', value: 2 },
            { key: 'b', label: 'Bucket B', value: 1 },
          ],
        },
        {
          id: 'mujeres',
          label: 'Mujeres',
          points: [
            { key: 'a', label: 'Bucket A', value: 1 },
            { key: 'c', label: 'Bucket C', value: 3 },
          ],
        },
      ],
    };

    const aligned = alignMultiSeriesForChart(dto);

    expect(aligned.categories).toEqual(['Bucket A', 'Bucket B', 'Bucket C']);
    expect(aligned.series[0]?.values).toEqual([2, 1, 0]);
    expect(aligned.series[1]?.values).toEqual([1, 0, 3]);
  });
});
