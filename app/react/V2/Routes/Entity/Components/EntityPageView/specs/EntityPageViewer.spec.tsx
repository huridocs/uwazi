/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider, createStore, useAtomValue } from 'jotai';
import { MemoryRouter } from 'react-router';
import { EntityPageViewProvider, EntityPageViewer } from '../index.js';
import { installEntityPageStore } from '../installEntityPageStore.js';
import type { EntityPageViewData } from '../types.js';
import { entityPageViewAtom } from '#V2/atoms/entityPageViewAtom.js';

jest.mock('#app/Markdown/index.js', () => ({
  MarkdownViewer: ({ markdown }: { markdown: string }) => (
    <div data-testid="markdown-viewer">{markdown}</div>
  ),
}));

jest.mock('#app/Markdown/components/index.js', () => ({
  Context: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

jest.mock('#app/Pages/components/PageStyle.js', () => ({
  PageStyle: () => null,
}));

const pageViewData: EntityPageViewData = {
  pageSharedId: 'page1',
  pageView: {
    title: 'Entity page',
    markdownSupport: true,
    metadata: {
      content: '<p>Hello from entity page</p>',
      script: '',
      css: '',
    },
  },
  itemLists: [],
  datasets: { entity: { sharedId: 'shared1', title: 'Sample' } },
  entityRaw: {
    _id: 'ent1',
    sharedId: 'shared1',
    language: 'en',
    title: 'Sample',
    template: 'template1',
  } as EntityPageViewData['entityRaw'],
};

type DatasetView = { get: (key: string) => unknown };

const isDatasetView = (value: unknown): value is DatasetView =>
  typeof value === 'object' && value !== null && 'get' in value && typeof value.get === 'function';

describe('EntityPageViewer', () => {
  it('renders page markdown content from context', async () => {
    const store = createStore();
    render(
      <JotaiProvider store={store}>
        <MemoryRouter>
          <EntityPageViewProvider entityPageView={pageViewData}>
            <EntityPageViewer />
          </EntityPageViewProvider>
        </MemoryRouter>
      </JotaiProvider>
    );

    const page = await screen.findByTestId('markdown-viewer');
    expect(page).toHaveTextContent('Hello from entity page');
    expect(page.closest('main')).toHaveClass('page-viewer', 'document-viewer');
    expect(page.closest('main')).not.toHaveClass('min-h-0', 'flex-1');
    expect(store.get(entityPageViewAtom)?.pageSharedId).toBe('page1');
  });

  it('publishes the page atom before children render', () => {
    const store = createStore();
    const seen: Array<string | undefined> = [];
    const Probe = () => {
      seen.push(useAtomValue(entityPageViewAtom)?.pageSharedId);
      return null;
    };

    render(
      <JotaiProvider store={store}>
        <EntityPageViewProvider entityPageView={pageViewData}>
          <Probe />
        </EntityPageViewProvider>
      </JotaiProvider>
    );

    expect(seen[0]).toBe('page1');
  });

  it('does not clear a page atom another view already replaced', () => {
    const store = createStore();
    const { unmount } = render(
      <JotaiProvider store={store}>
        <EntityPageViewProvider entityPageView={pageViewData}>
          <div />
        </EntityPageViewProvider>
      </JotaiProvider>
    );
    const replacement = { ...pageViewData, pageSharedId: 'page2' };
    store.set(entityPageViewAtom, replacement);

    unmount();

    expect(store.get(entityPageViewAtom)).toBe(replacement);
  });

  it('keeps a stable store snapshot and restores getState', () => {
    const base = { page: { datasets: {} }, marker: 1 };
    const store = { getState: () => base };
    const restore = installEntityPageStore(store, { a: 1 });
    const state = store.getState();
    const datasets = state.page?.datasets;
    expect(state).toBe(store.getState());
    expect(isDatasetView(datasets) && datasets.get('a')).toBe(1);
    restore();
    expect(store.getState()).toBe(base);
  });

  it('includes the page markup in server HTML without touching window.store', () => {
    const withScript = {
      ...pageViewData,
      pageView: {
        ...pageViewData.pageView,
        metadata: {
          content: '<p>Hello from entity page</p>',
          script: 'window.store.getState()',
        },
      },
    };
    const html = renderToString(
      <JotaiProvider store={createStore()}>
        <EntityPageViewProvider entityPageView={withScript}>
          <EntityPageViewer />
        </EntityPageViewProvider>
      </JotaiProvider>
    );
    expect(html).toContain('Hello from entity page');
  });

  it('renders nothing when there is no entity page view', () => {
    const { container } = render(
      <JotaiProvider store={createStore()}>
        <EntityPageViewProvider>
          <EntityPageViewer />
        </EntityPageViewProvider>
      </JotaiProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
