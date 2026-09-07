/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { LibraryEntityPreview } from '../LibraryEntityPreview.js';
import { LibraryView } from '../LibraryView.js';

jest.mock('#V2/Components/PDFViewer', () => ({
  ...jest.requireActual('#V2/Components/PDFViewer'),
  PDF: ({ fileUrl }: { fileUrl?: string }) => (
    <div data-testid="mock-pdf">
      PDF: {fileUrl}
      <div className="page" data-page-number="1" style={{ height: 800 }} />
    </div>
  ),
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();

  constructor(_callback: ResizeObserverCallback) {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const entityWithDocument: EntityType = {
  _id: 'ent1',
  sharedId: 'shared-doc',
  language: 'en',
  title: 'Case 11.481 (Gelman)',
  template: 'template1',
  creationDate: 0,
  user: 'user1',
  documents: [{ filename: 'file.pdf', _id: 'doc1', language: 'eng' }],
  metadata: {},
  relations: [
    { entity: 'rel-a', entityData: { title: 'Related A', template: 'template2' } },
    { entity: 'rel-b', entityData: { title: 'Related B', template: 'template2' } },
    { entity: 'rel-c', entityData: { title: 'Related C', template: 'template3' } },
  ],
};

const entityWithoutDocument: EntityType = {
  _id: 'ent2',
  sharedId: 'shared-meta',
  language: 'en',
  title: 'Mexico',
  template: 'template3',
  creationDate: 0,
  user: 'user1',
  documents: [],
  metadata: {},
  relations: [],
};

const emptyAggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
};

const getBySharedId = jest.fn();

let mediaMock = setupMatchMediaMock();

const adminUser = { _id: '1', role: 'admin', name: 'admin' };

const renderPreview = (sharedId: string, onClose = jest.fn(), user?: typeof adminUser) =>
  render(
    <TestRouterContext>
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [translationsAtom, translations],
            [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
            ...(user ? [[userAtom, user] as const] : []),
          ]}
        >
          <LibraryEntityPreview sharedId={sharedId} entityBasePath="/entityv2" onClose={onClose} />
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );

describe('LibraryEntityPreview', () => {
  beforeEach(() => {
    getBySharedId.mockImplementation(async (sharedId: string) => {
      if (sharedId === entityWithDocument.sharedId) return [[entityWithDocument]];
      if (sharedId === entityWithoutDocument.sharedId) return [[entityWithoutDocument]];
      return [undefined];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  it('shows Document, Metadata, Relationships and Files tabs and the PDF when the entity has a document', async () => {
    renderPreview(entityWithDocument.sharedId);

    expect(await screen.findByRole('tab', { name: 'Document' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Relationships/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Files/ })).toBeInTheDocument();

    const pdf = await screen.findByTestId('mock-pdf');
    expect(pdf).toHaveTextContent('/api/files/file.pdf');
    expect(screen.getByText('Case 11.481 (Gelman)')).toBeInTheDocument();
  });

  it('switches to the Metadata tab using the entity viewer tabs', async () => {
    renderPreview(entityWithDocument.sharedId);
    const documentTab = await screen.findByRole('tab', { name: 'Document' });
    fireEvent.click(screen.getByRole('tab', { name: 'Metadata' }));
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
    expect(documentTab).toHaveAttribute('aria-selected', 'false');
  });

  it('hides the Document tab when the entity has no document', async () => {
    renderPreview(entityWithoutDocument.sharedId);

    expect(await screen.findByRole('tab', { name: 'Metadata' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Relationships/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Files/ })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-pdf')).not.toBeInTheDocument();
  });

  it('closes from the footer, the header button, and Escape', async () => {
    const onClose = jest.fn();
    renderPreview(entityWithDocument.sharedId, onClose);
    await screen.findByText('Case 11.481 (Gelman)');

    const footer = await screen.findByTestId('library-entity-preview-footer');
    fireEvent.click(within(footer).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('links View entity to the entity viewer path', async () => {
    renderPreview(entityWithDocument.sharedId);
    const link = await screen.findByRole('link', { name: /View entity/ });
    expect(link).toHaveAttribute('href', '/en/entityv2/shared-doc');
  });

  it('shows Edit on Metadata, then Cancel, Save and a no-op Copy from when editing', async () => {
    renderPreview(entityWithoutDocument.sharedId, jest.fn(), adminUser);

    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy from/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View entity/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('does not offer Edit on Relationships', async () => {
    renderPreview(entityWithDocument.sharedId, jest.fn(), adminUser);
    fireEvent.click(await screen.findByRole('tab', { name: /^Relationships/ }));
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('shows file empty copy instead of empty tables when there are no files', async () => {
    renderPreview(entityWithoutDocument.sharedId);
    fireEvent.click(await screen.findByRole('tab', { name: /Files/ }));
    expect(
      await screen.findByText(
        'No primary documents yet. Promote a supporting file or add a new one.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('No supporting files yet. Add a file to get started.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select all files' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the entity cannot be loaded', async () => {
    renderPreview('missing');
    expect(await screen.findByText('NO DATA AVAILABLE')).toBeInTheDocument();
  });
});

describe('LibraryView preview pane', () => {
  beforeEach(() => {
    getBySharedId.mockResolvedValue([[entityWithDocument]]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  const viewProps = {
    rows: [],
    totalRows: 0,
    aggregations: emptyAggregations,
    search: '',
    onSearchChange: jest.fn(),
    view: 'cards' as const,
    onViewChange: jest.fn(),
    sort: '',
    order: 'desc' as const,
    onSortChange: jest.fn(),
    filters: {},
    onFiltersChange: jest.fn(),
    andFilters: [],
    onAndFiltersChange: jest.fn(),
    chips: [],
    onSelect: jest.fn(),
    onClosePreview: jest.fn(),
    entityBasePath: '/entityv2',
    onLoadMore: jest.fn(),
  };

  const renderView = (selectedId?: string) =>
    render(
      <TestRouterContext>
        <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
          <TestAtomStoreProvider
            initialValues={[
              [localeAtom, 'en'],
              [templatesAtom, templates],
              [translationsAtom, translations],
              [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
            ]}
          >
            <LibraryView {...viewProps} selectedId={selectedId} />
          </TestAtomStoreProvider>
        </ServicesProvider>
      </TestRouterContext>
    );

  it('shows filters when no entity is selected', async () => {
    renderView();
    expect(await screen.findByText('Filters')).toBeInTheDocument();
    expect(screen.queryByTestId('library-entity-preview')).not.toBeInTheDocument();
  });

  it('shows the entity preview instead of filters when an entity is selected', async () => {
    renderView(entityWithDocument.sharedId);
    expect(await screen.findByText('Case 11.481 (Gelman)')).toBeInTheDocument();
    expect(screen.getByTestId('library-entity-preview')).toBeInTheDocument();
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });
});
