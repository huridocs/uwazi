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

  it('renders placeholders for views that are not implemented yet', () => {
    renderViewer('map');
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Map view is not available yet.')).toBeInTheDocument();
  });
});
