/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router';
import { EntityPageViewProvider, EntityPageViewer } from '../index.js';
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

    expect(await screen.findByTestId('markdown-viewer')).toHaveTextContent(
      'Hello from entity page'
    );
    expect(store.get(entityPageViewAtom)?.pageSharedId).toBe('page1');
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
