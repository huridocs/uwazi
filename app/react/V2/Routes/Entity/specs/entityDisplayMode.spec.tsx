/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { isMobileOverrideAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import { Entity } from '../Entity.js';
import { entityDisplayModesAtom, type EntityDisplayMode } from '../entityDisplayModeAtom.js';
import type { EntityPageViewData } from '../Components/EntityPageView/index.js';

jest.mock('#app/Markdown/index.js', () => ({
  MarkdownViewer: ({ markdown }: { markdown: string }) => (
    <div data-testid="entity-page-markdown">{markdown}</div>
  ),
}));

jest.mock('#V2/Components/PDFViewer', () => ({
  PDF: () => <div data-testid="mock-pdf" />,
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock;

const entity: EntityType = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Sample Entity',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  metadata: {},
  documents: [{ filename: 'file.pdf', _id: '1', language: 'eng' }],
};

const pageView: EntityPageViewData = {
  pageSharedId: 'page1',
  pageView: {
    title: 'Custom page',
    markdownSupport: false,
    metadata: { content: '<p>Custom entity page</p>', script: '', css: '' },
  },
  itemLists: [],
  datasets: {},
  entityRaw: entity,
};

const adminUser = {
  _id: '1',
  role: 'admin',
  name: 'admin',
  username: 'admin',
  email: 'admin@example.com',
} as const;

const renderEntity = ({
  withPage = true,
  mobile = false,
  user,
  mode = 'published',
  entry = '/',
  sharedId = entity.sharedId,
  modes,
}: {
  withPage?: boolean;
  mobile?: boolean;
  user?: typeof adminUser;
  mode?: EntityDisplayMode;
  entry?: string;
  sharedId?: string;
  modes?: Record<string, EntityDisplayMode>;
} = {}) => {
  window.history.replaceState({}, '', entry);
  const shown = { ...entity, sharedId };
  const store = createStore();
  store.set(templatesAtom, [{ _id: 'template1', name: 'Template 1', properties: [] }]);
  store.set(isMobileOverrideAtom, mobile);
  store.set(entityDisplayModesAtom, modes ?? (mode === 'entity' ? { [sharedId]: mode } : {}));
  if (user) store.set(userAtom, user);

  const tree = (
    <TestRouterContext
      initialEntries={[entry]}
      loaderData={{
        entity: shown,
        mainDocument: shown.documents?.[0],
        pagePlaintext: '',
        entityPageView: withPage ? { ...pageView, entityRaw: shown } : undefined,
      }}
    >
      <Provider store={store}>
        <Entity />
      </Provider>
    </TestRouterContext>
  );

  return {
    store,
    ...render(
      user ? <ServicesProvider value={createTestServices()}>{tree}</ServicesProvider> : tree
    ),
  };
};

describe('entity display mode', () => {
  it('defaults to the published page when the template has a page view', async () => {
    renderEntity();
    expect(await screen.findByTestId('entity-page-markdown')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entity view' })).toBeInTheDocument();
    expect(document.getElementById('entity-view-published')).toHaveClass('template_template1');
  });

  it('opens the entity viewer when the route already selects a main tab', async () => {
    renderEntity({ entry: '/?m=metadata', mode: 'published' });
    expect(await screen.findByRole('tab', { name: 'Metadata' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByTestId('entity-page-markdown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Published view' })).toBeInTheDocument();
    expect(document.getElementById('entity-view-metadata')).toHaveClass('template_template1');
  });

  it('opens the published page when entering even if the previous view was the entity viewer', async () => {
    renderEntity({ mode: 'entity' });
    expect(await screen.findByTestId('entity-page-markdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-pdf')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entity view' })).toBeInTheDocument();
  });

  it('does not apply another entity’s saved view mode', async () => {
    const { store } = renderEntity({ sharedId: 'shared2', modes: { shared1: 'entity' } });
    expect(await screen.findByTestId('entity-page-markdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-pdf')).not.toBeInTheDocument();
    expect(store.get(entityDisplayModesAtom).shared1).toBe('entity');
    expect(store.get(entityDisplayModesAtom).shared2).toBe('published');
  });

  it('keeps the current viewer and hides the control when there is no page view', async () => {
    renderEntity({ withPage: false, mode: 'entity' });
    expect(await screen.findByTestId('mock-pdf')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entity view' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Published view' })).not.toBeInTheDocument();
  });

  it('opens the entity viewer on Metadata and returns to the page', async () => {
    renderEntity();
    fireEvent.click(await screen.findByRole('button', { name: 'Entity view' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
    expect(screen.queryByTestId('entity-page-markdown')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Published view' }));
    expect(await screen.findByTestId('entity-page-markdown')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.search).not.toContain('m=');
    });
  });

  it('stays on the entity viewer when another main tab is selected', async () => {
    renderEntity();
    fireEvent.click(await screen.findByRole('button', { name: 'Entity view' }));
    fireEvent.click(await screen.findByRole('tab', { name: 'Document' }));
    expect(await screen.findByTestId('mock-pdf')).toBeInTheDocument();
    expect(screen.queryByTestId('entity-page-markdown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Published view' })).toBeInTheDocument();
    expect(document.getElementById('entity-view-document')).toHaveClass('template_template1');
  });

  it('asks to discard a dirty metadata edit instead of leaving the viewer', async () => {
    renderEntity({ user: adminUser });
    fireEvent.click(await screen.findByRole('button', { name: 'Entity view' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(await screen.findByRole('textbox', { name: /Title/ }), {
      target: { value: 'Dirty draft' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Published view' }));

    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.queryByTestId('entity-page-markdown')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
  });

  it('places the switch on the tab row without reserving space on desktop', async () => {
    renderEntity();
    const toggle = await screen.findByRole('button', { name: 'Entity view' });
    expect(toggle).toHaveClass(
      'fixed',
      'z-30',
      'top-16.25',
      'inset-e-3',
      'h-7',
      'w-7',
      'rounded-md',
      'bg-warm'
    );
    expect(toggle.querySelector('svg')).toHaveClass('rtl:-scale-x-100');
    fireEvent.click(toggle);
    const metadata = await screen.findByRole('tab', { name: 'Metadata' });
    expect(metadata.closest('.justify-between')?.querySelector('.me-10')).toBeNull();
  });

  it('reserves the toggle slot on the main row when the screen is narrow', async () => {
    renderEntity({ mobile: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Entity view' }));
    expect(await screen.findByRole('button', { name: 'Published view' })).toBeInTheDocument();
    expect(document.querySelector('.me-10')).not.toBeNull();
  });
});
