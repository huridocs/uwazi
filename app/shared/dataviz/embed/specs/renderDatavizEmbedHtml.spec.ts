import { renderDatavizEmbedHtml } from '../renderDatavizEmbedHtml.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';

const manualListPayload: DatavizEmbedPayload = {
  chart: { type: 'list', showTooltip: true, showLabels: true },
  appearance: { colorMode: 'from_data' },
  data: {
    series: [
      {
        id: 'main',
        label: 'Series 1',
        points: [
          { key: 'a', label: 'Category A', value: 12 },
          { key: 'b', label: 'Category B', value: 8 },
        ],
      },
    ],
    meta: { totalEntities: 20 },
  },
};

const manualBarPayload: DatavizEmbedPayload = {
  chart: { type: 'bar', showTooltip: true, showLabels: true },
  appearance: { colorMode: 'from_data' },
  data: {
    series: [
      {
        id: 'main',
        label: 'Series 1',
        points: [{ key: 'a', label: 'Embed Category A', value: 12 }],
      },
    ],
    meta: { totalEntities: 12 },
  },
};

describe('renderDatavizEmbedHtml', () => {
  it('should render list charts as static HTML without echarts scripts', () => {
    const html = renderDatavizEmbedHtml({ payload: manualListPayload, language: 'en' });

    expect(html).toContain('Category A');
    expect(html).toContain('<table>');
    expect(html).not.toContain('echarts.min.js');
    expect(html).not.toContain('dataviz-embed.js');
  });

  it('should render echarts charts with precomputed option and bootstrap', () => {
    const html = renderDatavizEmbedHtml({ payload: manualBarPayload, language: 'en' });

    expect(html).toContain('__DATAVIZ_CHART_OPTION__');
    expect(html).toContain('Embed Category A');
    expect(html).toContain('echarts.min.js');
    expect(html).toContain('/dataviz-embed.js');
    expect(html).not.toContain('main.js');
  });
});
