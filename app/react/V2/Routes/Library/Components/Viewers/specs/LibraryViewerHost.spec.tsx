/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { LibraryViewerHost } from '../LibraryViewerHost.js';
import { libraryTableColumns } from '../../libraryTableColumns.js';

jest.mock('#app/Map/index.js', () => ({
  Map: ({ markers }: { markers?: unknown[] }) => (
    <div data-testid="library-map" data-marker-count={markers?.length ?? 0} />
  ),
}));

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'case-1',
    language: 'en',
    title: 'The State v. Example',
    template: 'template1',
    creationDate: 1704067200000,
  },
];

const renderViewer = (view: 'cards' | 'map' | 'table') =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <LibraryViewerHost
          view={view}
          rows={rows}
          totalRows={1}
          onSelect={() => undefined}
          entityBasePath="/entityv2"
          onLoadMore={() => undefined}
          showThumbnail
          showMetadata
          tableColumns={libraryTableColumns(templates, ['template1'])}
          tableDensity="compact"
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('LibraryViewerHost', () => {
  it('renders cards for the cards view', () => {
    renderViewer('cards');
    expect(screen.getByText('The State v. Example')).toBeInTheDocument();
  });

  it('renders the map viewer for the map view', () => {
    renderViewer('map');
    expect(screen.getByTestId('library-map')).toBeInTheDocument();
    expect(screen.queryByText('Map view is not available yet.')).not.toBeInTheDocument();
  });

  it('renders the table viewer for the table view', () => {
    renderViewer('table');
    expect(screen.getByTestId('library-table')).toBeInTheDocument();
    expect(screen.getByText('The State v. Example')).toBeInTheDocument();
    expect(screen.queryByText('Table view is not available yet.')).not.toBeInTheDocument();
  });
});
