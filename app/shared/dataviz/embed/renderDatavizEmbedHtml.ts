import serialize from 'serialize-javascript';
import type { EChartsOption } from 'echarts';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { mapToEChartsOption } from '#shared/dataviz/mappers/index.js';

const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';

const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: system-ui, sans-serif; background: #fff; color: #1c1712; }
  body { padding: 16px; }
  #dataviz-embed-root { width: 100%; min-height: 320px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { border-bottom: 1px solid #e8e4dc; padding: 8px 12px; text-align: left; }
  th { color: #6b6560; font-weight: 500; }
  td.num, th.num { text-align: right; }
  .metric { display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px; border: 1px solid #e8e4dc; border-radius: 8px; }
  .metric-value { font-size: 3rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .metric-label { margin-top: 8px; font-size: 14px; color: #6b6560; }
  .error { color: #b91c1c; font-size: 14px; }
  .stale { color: #b45309; font-size: 12px; margin-bottom: 8px; }
`;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderListHtml = (payload: DatavizEmbedPayload): string => {
  const points = payload.data.series[0]?.points ?? [];
  if (!points.length) {
    return '<p class="error">No data</p>';
  }

  const rows = points
    .map(
      point =>
        `<tr><td>${escapeHtml(String(point.label))}</td><td class="num">${escapeHtml(String(point.value))}</td></tr>`
    )
    .join('');

  return `<table><thead><tr><th>Label</th><th class="num">Count</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const renderMetricHtml = (payload: DatavizEmbedPayload): string => {
  const points = payload.data.series[0]?.points ?? [];
  const primary = points[0];
  const value = primary?.value ?? payload.data.meta?.totalEntities ?? 0;
  const label = primary?.label ?? 'Total';
  const bg = payload.appearance?.themeColors?.background;
  const fg = payload.appearance?.themeColors?.foreground;
  const style = [
    bg ? `background-color:${escapeHtml(bg)}` : '',
    fg ? `color:${escapeHtml(fg)}` : '',
  ]
    .filter(Boolean)
    .join(';');

  return `<div class="metric"${style ? ` style="${style}"` : ''}><div class="metric-value">${escapeHtml(String(value.toLocaleString()))}</div><div class="metric-label">${escapeHtml(String(label))}</div></div>`;
};

const renderEchartsBody = (
  payload: DatavizEmbedPayload,
  option: EChartsOption,
  embedScriptUrl: string
): string => {
  const stale = payload.data.stale ? '<p class="stale">Data may be outdated.</p>' : '';
  const height = payload.data.series.length > 1 ? 360 : 320;
  const scripts = `
    <script>window.__DATAVIZ_CHART_OPTION__ = ${serialize(option, { isJSON: true })};</script>
    <script src="${ECHARTS_CDN}" crossorigin="anonymous"></script>
    <script src="${embedScriptUrl}"></script>
  `;

  return `${stale}<div id="dataviz-embed-root" style="height:${height}px"></div>${scripts}`;
};

type RenderDatavizEmbedHtmlInput = {
  payload: DatavizEmbedPayload;
  language: string;
  embedScriptUrl?: string;
};

const renderDatavizEmbedHtml = ({
  payload,
  language,
  embedScriptUrl = '/dataviz-embed.js',
}: RenderDatavizEmbedHtmlInput): string => {
  const chartType = payload.chart.type;
  let body: string;

  if (chartType === 'list') {
    body = renderListHtml(payload);
  } else if (chartType === 'metric') {
    body = renderMetricHtml(payload);
  } else {
    const option = mapToEChartsOption(payload.data, payload.chart, payload.appearance);
    if (!option) {
      body = '<p class="error">This chart type cannot display the current data.</p>';
    } else {
      body = renderEchartsBody(payload, option, embedScriptUrl);
    }
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Data visualization</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${body}
</body>
</html>`;
};

const renderDatavizEmbedErrorHtml = (message: string, status: number): string =>
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Data visualization</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <p class="error">${escapeHtml(message)}</p>
  <!-- status:${status} -->
</body>
</html>`;

export { renderDatavizEmbedHtml, renderDatavizEmbedErrorHtml, ECHARTS_CDN };
