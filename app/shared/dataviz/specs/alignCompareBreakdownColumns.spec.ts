import { alignCompareBreakdownColumns } from '../alignCompareBreakdownColumns.js';

describe('alignCompareBreakdownColumns', () => {
  it('should align primary categories and secondary columns across compare series', () => {
    const aligned = alignCompareBreakdownColumns({
      datavizId: 'dv-1',
      generatedAt: new Date().toISOString(),
      stale: false,
      meta: { totalEntities: 10, truncated: false, queryDurationMs: 1 },
      series: [
        {
          id: 'owners',
          label: 'Owners',
          points: [
            {
              key: 'spain',
              label: 'Spain',
              value: 5,
              breakdown: [
                { key: 'm', label: 'Male', value: 3 },
                { key: 'f', label: 'Female', value: 2 },
              ],
            },
          ],
        },
        {
          id: 'owners_2',
          label: 'Owners 2',
          points: [
            {
              key: 'france',
              label: 'France',
              value: 4,
              breakdown: [{ key: 'm', label: 'Male', value: 4 }],
            },
          ],
        },
      ],
    });

    expect(aligned.series[0]?.points).toEqual([
      {
        key: 'france',
        label: 'France',
        value: 0,
        breakdown: [
          { key: 'm', label: 'Male', value: 0 },
          { key: 'f', label: 'Female', value: 0 },
        ],
      },
      {
        key: 'spain',
        label: 'Spain',
        value: 5,
        breakdown: [
          { key: 'm', label: 'Male', value: 3 },
          { key: 'f', label: 'Female', value: 2 },
        ],
      },
    ]);

    expect(aligned.series[1]?.points).toEqual([
      {
        key: 'france',
        label: 'France',
        value: 4,
        breakdown: [
          { key: 'm', label: 'Male', value: 4 },
          { key: 'f', label: 'Female', value: 0 },
        ],
      },
      {
        key: 'spain',
        label: 'Spain',
        value: 0,
        breakdown: [
          { key: 'm', label: 'Male', value: 0 },
          { key: 'f', label: 'Female', value: 0 },
        ],
      },
    ]);
  });
});
