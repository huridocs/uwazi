/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';

const renderFooter = (role?: string) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, role ? { _id: 'u1', role, username: 'user' } : undefined],
        ]}
      >
        <LibraryResultsFooter />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('LibraryResultsFooter', () => {
  it('renders editor actions and the CSV link for admins', () => {
    renderFooter('admin');
    expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import / Export CSV' })).toHaveAttribute(
      'href',
      '/en/settings/csv'
    );
  });

  it('hides the CSV link for editors', () => {
    renderFooter('editor');
    expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Import / Export CSV' })).not.toBeInTheDocument();
  });

  it('hides the footer for anonymous users', () => {
    renderFooter();
    expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
  });
});
