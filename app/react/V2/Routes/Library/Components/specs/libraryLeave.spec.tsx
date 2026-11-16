/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRoutesStub, Link } from 'react-router';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import {
  isMobileOverrideAtom,
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { LibraryEntityPreview } from '../LibraryEntityPreview.js';
import { LibraryView } from '../LibraryView.js';

jest.mock('#V2/Routes/Entity/Components/relationships/overlay/EntityOverlay.js', () => ({
  EntityOverlay: () => <div data-testid="stacked-entity-overlay" />,
}));

jest.mock('#V2/Components/PDFViewer', () => ({
  ...jest.requireActual('#V2/Components/PDFViewer'),
  PDF: () => <div data-testid="mock-pdf" />,
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const entity: EntityType = {
  _id: 'ent1',
  sharedId: 'shared-doc',
  language: 'en',
  title: 'Case 11.481 (Gelman)',
  template: 'template1',
  creationDate: 0,
  user: 'user1',
  documents: [{ filename: 'file.pdf', _id: 'doc1', language: 'eng' }],
  metadata: {},
};

const rows: LibrarySearchHit[] = [
  {
    _id: entity._id,
    sharedId: entity.sharedId,
    title: entity.title,
    template: entity.template,
    language: entity.language,
    metadata: {},
  },
  {
    _id: 'ent2',
    sharedId: 'shared-meta',
    title: 'Mexico',
    template: 'template3',
    language: 'en',
    metadata: {},
  },
];

const aggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
};

const admin = { _id: '1', role: 'admin', name: 'admin' };
const getBySharedId: EntitiesService['getBySharedId'] = async () => [[entity]];
let mediaMock = setupMatchMediaMock();

const dirtyMetadata = async (mobile = false) => {
  if (mobile) {
    fireEvent.click(await screen.findByRole('button', { name: 'Entity primary' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Metadata' }));
  } else {
    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
  }
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  fireEvent.change(await screen.findByLabelText(/Title/), { target: { value: 'Changed' } });
};

const dismissUnsaved = () => {
  fireEvent.click(screen.getByTestId('cancel-button'));
};

describe('library dirty leave', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  const renderView = (mobile = false) => {
    const onClosePreview = jest.fn();
    const onSelectedIdsChange = jest.fn();
    render(
      <TestRouterContext>
        <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
          <TestAtomStoreProvider
            initialValues={[
              [localeAtom, 'en'],
              [templatesAtom, templates],
              [translationsAtom, translations],
              [
                settingsAtom,
                { languages: [{ key: 'en', label: 'English', default: true }], features: {} },
              ],
              [userAtom, admin],
              ...(mobile ? [[isMobileOverrideAtom, true] as const] : []),
            ]}
          >
            <LibraryView
              rows={rows}
              totalRows={rows.length}
              aggregations={aggregations}
              search=""
              onSearchChange={jest.fn()}
              view="cards"
              onViewChange={jest.fn()}
              sort=""
              order="desc"
              onSortChange={jest.fn()}
              filters={{}}
              onFiltersChange={jest.fn()}
              andFilters={[]}
              onAndFiltersChange={jest.fn()}
              chips={[]}
              selectedIds={[entity.sharedId]}
              onSelectedIdsChange={onSelectedIdsChange}
              onClosePreview={onClosePreview}
              entityBasePath="/entityv2"
            />
          </TestAtomStoreProvider>
        </ServicesProvider>
      </TestRouterContext>
    );
    return { onClosePreview, onSelectedIdsChange };
  };

  it('stays on the entity when close is dismissed', async () => {
    const { onClosePreview } = renderView();
    await dirtyMetadata();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    dismissUnsaved();
    expect(onClosePreview).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
  });

  it('stays on the entity when another row is dismissed', async () => {
    const { onSelectedIdsChange } = renderView();
    await dirtyMetadata();
    fireEvent.click(screen.getByRole('button', { name: /Mexico/ }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    dismissUnsaved();
    expect(onSelectedIdsChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
  });

  it('stays on the entity when create is dismissed', async () => {
    renderView();
    await dirtyMetadata();
    fireEvent.click(screen.getByRole('button', { name: 'Create entity' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    dismissUnsaved();
    expect(screen.queryByText('New entity')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
  });

  it('stays on the entity when the mobile sheet close is dismissed', async () => {
    const { onClosePreview } = renderView(true);
    await dirtyMetadata(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    dismissUnsaved();
    expect(onClosePreview).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
    expect(document.querySelector('[data-part="sheet"]')).not.toBeNull();
  });

  it('collapses the mobile sheet after a clean close', async () => {
    const { onClosePreview } = renderView(true);
    await waitFor(() => {
      expect(document.querySelector('[data-part="close"]')).toBeInstanceOf(HTMLButtonElement);
    });
    const button = document.querySelector('[data-part="close"]');
    if (!(button instanceof HTMLButtonElement)) throw new Error('sheet close');
    fireEvent.click(button);
    expect(onClosePreview).toHaveBeenCalled();
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  });

  it('collapses the mobile sheet after discarding unsaved edits', async () => {
    const { onClosePreview } = renderView(true);
    await dirtyMetadata(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClosePreview).toHaveBeenCalled();
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  });

  it('blocks a pathname change to settings', async () => {
    const Stub = createRoutesStub([
      {
        path: '/en/library',
        Component: () => (
          <>
            <Link to="/en/settings">Settings</Link>
            <LibraryEntityPreview
              sharedId={entity.sharedId}
              entityBasePath="/entityv2"
              onClose={jest.fn()}
              onAction={jest.fn()}
            />
          </>
        ),
      },
      { path: '/en/settings', Component: () => <div>Settings page</div> },
    ]);
    render(
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [translationsAtom, translations],
            [
              settingsAtom,
              { languages: [{ key: 'en', label: 'English', default: true }], features: {} },
            ],
            [userAtom, admin],
          ]}
        >
          <Stub initialEntries={['/en/library']} />
        </TestAtomStoreProvider>
      </ServicesProvider>
    );
    await dirtyMetadata();
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.queryByText('Settings page')).not.toBeInTheDocument();
    dismissUnsaved();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Changed');
  });
});
