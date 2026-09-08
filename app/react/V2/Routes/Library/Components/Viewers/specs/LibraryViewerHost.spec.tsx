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
  },
];

const renderViewer = (view: 'cards' | 'list' | 'map' | 'table' | 'timeline') =>
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

  it('renders placeholders for views that are not implemented yet', () => {
    renderViewer('table');
    expect(screen.getByText('Table view is not available yet.')).toBeInTheDocument();
  });
});
