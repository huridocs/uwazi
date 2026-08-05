import { renderDatavizEmbedHtml } from '../renderDatavizEmbedHtml.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';

const manualListPayload: DatavizEmbedPayload = {
  chart: { type: 'list', showTooltip: true, showLabels: true },
  appearance: { colorMode: 'from_data' },
  data: {
    datavizId: 'dv-embed-list',
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
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
    meta: { totalEntities: 20, truncated: false },
  },
};

const manualBarPayload: DatavizEmbedPayload = {
  chart: { type: 'bar', showTooltip: true, showLabels: true },
  data: {
    datavizId: 'dv-embed-list',
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
    series: [
      {
        id: 'main',
        label: 'Series 1',
        points: [{ key: 'a', label: 'Embed Category A', value: 12 }],
      },
    ],
    meta: { totalEntities: 12, truncated: false },
  },
  appearance: { colorMode: 'from_data' },
};

describe('renderDatavizEmbedHtml', () => {
  it('should render list charts with bootstrap for postMessage filters', () => {
    const html = renderDatavizEmbedHtml({
      payload: manualListPayload,
      language: 'en',
      datavizId: 'dv-embed-list',
    });

    expect(html).toContain('Category A');
    expect(html).toContain('<table>');
    expect(html).toContain('__DATAVIZ_EMBED__');
    expect(html).toContain('dataviz-embed.js');
    expect(html).not.toContain('echarts.min.js');
  });

  it('should render echarts charts with option, bootstrap and parentOrigin allowlist', () => {
    const html = renderDatavizEmbedHtml({
      payload: manualBarPayload,
      language: 'en',
      datavizId: 'dv-embed-bar',
      embedScriptUrl: 'http://localhost:8080/dataviz-embed.js',
      parentOrigin: 'https://partner.example',
    });

    expect(html).toContain('__DATAVIZ_CHART_OPTION__');
    expect(html).toContain('__DATAVIZ_EMBED__');
    expect(html).toContain('dv-embed-bar');
    expect(html).toContain('partner.example');
    expect(html).toContain('Embed Category A');
    expect(html).toContain('echarts.min.js');
    expect(html).toContain('http://localhost:8080/dataviz-embed.js');
    expect(html).not.toContain('main.js');
  });
});
