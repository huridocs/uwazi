import { mapToEChartsOption } from '#shared/dataviz/mappers/index.js';
import {
  applyDatavizFilterEvent,
  runtimeFiltersFromRecord,
} from '#shared/dataviz/applyDatavizFilterEvent.js';
import {
  DATAVIZ_FILTER_EVENT,
  type DatavizAppearance,
  type DatavizChartConfig,
  type DatavizEmbedPayload,
  type DatavizFilterEventDetail,
  type DatavizRuntimeFilterValue,
} from '#shared/types/datavizSchema.js';

type EChartsInstance = {
  setOption: (option: unknown, notMerge?: boolean) => void;
  resize: () => void;
};

type DatavizEmbedBootstrap = {
  id: string;
  locale: string;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  allowedOrigins: string[];
};

declare global {
  interface Window {
    __DATAVIZ_CHART_OPTION__?: Record<string, unknown>;
    __DATAVIZ_EMBED__?: DatavizEmbedBootstrap;
    echarts?: {
      init: (el: HTMLElement) => EChartsInstance;
    };
  }
}

const REFRESH_DEBOUNCE_MS = 150;

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

const isAllowedOrigin = (origin: string, allowedOrigins: string[]): boolean => {
  if (origin === window.location.origin) {
    return true;
  }
  return allowedOrigins.includes(origin);
};

const isFilterMessage = (
  data: unknown
): data is { type: string; detail: DatavizFilterEventDetail } => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const message = data as { type?: unknown; detail?: unknown };
  return message.type === DATAVIZ_FILTER_EVENT && typeof message.detail === 'object';
};

const buildEmbedDataUrl = (
  id: string,
  locale: string,
  filters: ReturnType<typeof runtimeFiltersFromRecord>
): string => {
  const params = new URLSearchParams();
  if (locale) {
    params.set('locale', locale);
  }
  if (filters.length) {
    params.set('externalFilters', JSON.stringify(filters));
  }
  const query = params.toString();
  return `/api/public/dataviz/${encodeURIComponent(id)}/data${query ? `?${query}` : ''}`;
};

const initDatavizEmbed = () => {
  const root = document.getElementById('dataviz-embed-root');
  const bootstrap = window.__DATAVIZ_EMBED__;
  if (!root || !bootstrap?.id) {
    return;
  }

  const kind = root.dataset.kind ?? 'echarts';
  let chart: EChartsInstance | null = null;
  let filtersByProperty: Record<string, DatavizRuntimeFilterValue> = {};
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  if (kind === 'echarts') {
    const option = window.__DATAVIZ_CHART_OPTION__;
    const echartsGlobal = window.echarts;
    if (!option || !echartsGlobal) {
      return;
    }
    chart = echartsGlobal.init(root);
    chart.setOption(option);
    window.addEventListener('resize', () => {
      chart?.resize();
    });
  }

  const renderPayload = (payload: DatavizEmbedPayload) => {
    if (kind === 'list') {
      root.innerHTML = renderListHtml(payload);
      return;
    }
    if (kind === 'metric') {
      root.innerHTML = renderMetricHtml(payload);
      return;
    }
    if (!chart) {
      return;
    }
    const option = mapToEChartsOption(payload.data, bootstrap.chart, bootstrap.appearance, {
      locale: bootstrap.locale,
      defaultLocale: bootstrap.locale,
    });
    if (option) {
      chart.setOption(option, false);
    }
  };

  const refresh = async () => {
    requestId += 1;
    const currentRequest = requestId;
    const filters = runtimeFiltersFromRecord(filtersByProperty);
    try {
      const response = await fetch(buildEmbedDataUrl(bootstrap.id, bootstrap.locale, filters), {
        headers: bootstrap.locale ? { 'Content-Language': bootstrap.locale } : undefined,
      });
      if (!response.ok || currentRequest !== requestId) {
        return;
      }
      const payload = (await response.json()) as DatavizEmbedPayload;
      if (currentRequest !== requestId) {
        return;
      }
      renderPayload(payload);
    } catch {
      // Keep the last successful render on network errors.
    }
  };

  const scheduleRefresh = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      refresh().catch(() => undefined);
    }, REFRESH_DEBOUNCE_MS);
  };

  window.addEventListener('message', (event: MessageEvent) => {
    if (!isAllowedOrigin(event.origin, bootstrap.allowedOrigins)) {
      return;
    }
    if (!isFilterMessage(event.data)) {
      return;
    }

    const next = applyDatavizFilterEvent(filtersByProperty, bootstrap.id, event.data.detail);
    if (!next) {
      return;
    }
    filtersByProperty = next;
    scheduleRefresh();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDatavizEmbed);
} else {
  initDatavizEmbed();
}

export {};
