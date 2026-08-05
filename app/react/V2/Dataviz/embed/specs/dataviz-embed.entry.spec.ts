/**
 * @jest-environment jsdom
 */
import { DATAVIZ_FILTER_EVENT } from '#shared/types/datavizSchema.js';
import { initDatavizEmbed } from '../dataviz-embed.entry.js';

const CHART_ID = 'chart-embed-1';
const PARENT_ORIGIN = 'https://parent.example';

const listPayload = {
  chart: { type: 'list' as const, showTooltip: true, showLabels: true },
  appearance: { colorMode: 'from_data' as const },
  data: {
    datavizId: CHART_ID,
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
    series: [
      {
        id: 'main',
        label: 'Series 1',
        points: [{ key: 'a', label: 'Filtered A', value: 5 }],
      },
    ],
    meta: { totalEntities: 5, truncated: false },
  },
};

const postFilter = (origin: string, detail: Record<string, unknown>) => {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin,
      data: { type: DATAVIZ_FILTER_EVENT, detail },
    })
  );
};

describe('dataviz-embed.entry postMessage filters', () => {
  let cleanup: (() => void) | undefined;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="dataviz-embed-root" data-kind="list"></div>';
    window.__DATAVIZ_EMBED__ = {
      id: CHART_ID,
      locale: 'en',
      chart: listPayload.chart,
      appearance: listPayload.appearance,
      allowedOrigins: [PARENT_ORIGIN],
    };

    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => listPayload,
    });
    global.fetch = fetchMock as typeof fetch;

    cleanup = initDatavizEmbed();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    delete window.__DATAVIZ_EMBED__;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should refetch public data with externalFilters from an allowed origin', async () => {
    postFilter(PARENT_ORIGIN, {
      property: 'colors',
      value: { values: ['color_black'] },
    });

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/public/dataviz/${CHART_ID}/data`);
    expect(url).toContain('locale=en');
    const externalFilters = new URL(url, 'http://localhost').searchParams.get('externalFilters');
    expect(JSON.parse(externalFilters!)).toEqual([
      { property: 'colors', value: { values: ['color_black'] } },
    ]);
    expect(init.headers).toEqual({ 'Content-Language': 'en' });
    expect(document.getElementById('dataviz-embed-root')?.innerHTML).toContain('Filtered A');
  });

  it('should ignore messages from disallowed origins', async () => {
    postFilter('https://evil.example', {
      property: 'colors',
      value: { values: ['color_black'] },
    });

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should ignore non-filter messages', async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: PARENT_ORIGIN,
        data: { type: 'other:event', detail: { property: 'colors', value: { values: ['x'] } } },
      })
    );

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should accumulate then clear property filters across messages', async () => {
    postFilter(PARENT_ORIGIN, {
      property: 'colors',
      value: { values: ['color_black'] },
    });
    postFilter(PARENT_ORIGIN, {
      property: 'mileage',
      value: { max: 80000 },
    });

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    let externalFilters = new URL(fetchMock.mock.calls[0][0], 'http://localhost').searchParams.get(
      'externalFilters'
    );
    expect(JSON.parse(externalFilters!)).toEqual(
      expect.arrayContaining([
        { property: 'colors', value: { values: ['color_black'] } },
        { property: 'mileage', value: { max: 80000 } },
      ])
    );

    postFilter(PARENT_ORIGIN, {
      property: 'colors',
      value: null,
    });

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    externalFilters = new URL(fetchMock.mock.calls[1][0], 'http://localhost').searchParams.get(
      'externalFilters'
    );
    expect(JSON.parse(externalFilters!)).toEqual([{ property: 'mileage', value: { max: 80000 } }]);
  });

  it('should allow same-origin messages without parentOrigin allowlist entry', async () => {
    window.__DATAVIZ_EMBED__ = {
      ...window.__DATAVIZ_EMBED__!,
      allowedOrigins: [],
    };
    cleanup?.();
    cleanup = initDatavizEmbed();

    postFilter(window.location.origin, {
      property: 'colors',
      value: { values: ['color_red'] },
    });

    await jest.advanceTimersByTimeAsync(150);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
