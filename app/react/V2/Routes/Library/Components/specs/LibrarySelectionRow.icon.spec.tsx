/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, settingsAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { LibrarySelectionRow } from '../LibrarySelectionRow.js';

jest.mock('#UI/Icon/Icon.js', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="fa-icon">{icon}</span>,
}));

const hit: LibrarySearchHit = {
  _id: '1',
  sharedId: 'case-1',
  title: 'Test1',
  template: 'template1',
  language: 'en',
  icon: { _id: 'star', type: 'Icons', label: 'Star' },
};

describe('LibrarySelectionRow entity icon', () => {
  it('shows the icon beside the title', () => {
    render(
      <MemoryRouter>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [translationsAtom, translations],
            [settingsAtom, { languages: [{ key: 'en', default: true }] }],
          ]}
        >
          <LibrarySelectionRow
            hit={hit}
            entityBasePath="/entityv2"
            showThumbnail={false}
            showMetadata={false}
            thumbSize="s"
            onPreview={() => undefined}
            onRemove={() => undefined}
          />
        </TestAtomStoreProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('fa-icon')).toHaveTextContent('star');
    expect(screen.getByText('Test1')).toBeInTheDocument();
  });
});
