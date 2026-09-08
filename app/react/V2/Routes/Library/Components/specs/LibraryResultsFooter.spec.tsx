/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';

const renderFooter = () =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
        ]}
      >
        <LibraryResultsFooter />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('LibraryResultsFooter', () => {
  it('renders the library action bar', () => {
    renderFooter();
    expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import / Export CSV' })).toHaveAttribute(
      'href',
      '/en/settings/csv'
    );
  });
});
