import { mapPieOption } from '../pieMapper.js';

describe('pieMapper', () => {
  it('should include slice names in legend data with a readable text color', () => {
    const option = mapPieOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 3, truncated: false },
        series: [
          {
            id: 'countries',
            label: 'Countries',
            points: [
              { key: 'us', label: 'United States', value: 14 },
              { key: 'pe', label: 'Peru', value: 12 },
              { key: 'co', label: 'Colombia', value: 12 },
            ],
          },
        ],
      },
      { type: 'pie', showLegend: true },
      { colorMode: 'theme' }
    );

    expect(option.legend).toMatchObject({
      data: ['United States', 'Peru', 'Colombia'],
      textStyle: { color: '#1a1a1a' },
    });
  });
});
