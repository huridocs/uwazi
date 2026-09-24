/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderFooter = (
  props: { onCreateEntity?: () => void; onUploadPdf?: () => void } = {},
  user: typeof adminUser | undefined = adminUser
) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, user],
        ]}
      >
        <LibraryResultsFooter
          onCreateEntity={props.onCreateEntity}
          onUploadPdf={props.onUploadPdf}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('LibraryResultsFooter', () => {
  it('renders the library action bar', () => {
    renderFooter();
    expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import CSV' })).toHaveAttribute(
      'href',
      '/en/settings/csv'
    );
  });

  it('opens create and upload actions', () => {
    const onCreateEntity = jest.fn();
    const onUploadPdf = jest.fn();
    renderFooter({ onCreateEntity, onUploadPdf });
    fireEvent.click(screen.getByRole('button', { name: 'Create entity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));
    expect(onCreateEntity).toHaveBeenCalledTimes(1);
    expect(onUploadPdf).toHaveBeenCalledTimes(1);
  });
});
