/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Provider, createStore } from 'jotai';
import { hydrateAtomStore } from '#V2/atoms/store.js';
import { settingsAtom, localeAtom, userAtom, translationsAtom } from '#V2/atoms/index.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { DatavizEmbedRoute } from '../DatavizEmbedRoute.js';

jest.mock('echarts-for-react', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-chart" />,
}));

const minimalEmbedSettings = {
  languages: [{ default: true, key: 'en', label: 'English' }],
  private: false,
};

const embedPayload: DatavizEmbedPayload = {
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

const renderEmbedRoute = () => {
  const store = createStore();
  hydrateAtomStore(
    {
      locale: 'en',
      settings: minimalEmbedSettings,
      user: {},
      isMobile: false,
    } as any,
    store
  );

  const router = createMemoryRouter(
    [{ path: '/embed/dataviz/:id', element: <DatavizEmbedRoute /> }],
    { initialEntries: ['/embed/dataviz/test-chart-id?locale=en'] }
  );

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

describe('DatavizEmbedRoute', () => {
  beforeEach(() => {
    window.__datavizEmbedPayload__ = embedPayload;
  });

  afterEach(() => {
    delete window.__datavizEmbedPayload__;
  });

  it('should render the chart when hydrated with minimal embed atom store data', () => {
    renderEmbedRoute();

    expect(screen.queryByText('Loading visualization…')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('should keep translations defined after minimal embed hydration', () => {
    const store = createStore();
    hydrateAtomStore(
      {
        locale: 'en',
        settings: minimalEmbedSettings,
        user: {},
        isMobile: false,
      } as any,
      store
    );

    expect(store.get(translationsAtom)).toEqual([]);
    expect(store.get(settingsAtom)).toEqual(minimalEmbedSettings);
    expect(store.get(localeAtom)).toBe('en');
    expect(store.get(userAtom)).toEqual({});
  });
});
