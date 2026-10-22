/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { FacetLookup } from '../../lookupAggregation.js';
import type { FacetMode } from '../FacetCard.js';
import { KeywordFacet } from '../KeywordFacet.js';

jest.mock('#UI/Icon/Icon.js', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="fa-icon">{icon}</span>,
}));

const manyBuckets: LibraryFacetBucket[] = Array.from({ length: 12 }, (_, index) => ({
  id: `opt-${index + 1}`,
  label: `Option ${index + 1}`,
  count: 12 - index,
}));

const renderFacet = ({
  buckets = manyBuckets,
  selected = [],
  mode,
  lookup,
  alwaysSearch,
}: {
  buckets?: LibraryFacetBucket[];
  selected?: string[];
  mode?: FacetMode;
  lookup?: FacetLookup;
  alwaysSearch?: boolean;
} = {}) => {
  const onToggle = jest.fn();
  const onModeChange = jest.fn();
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [translationsAtom, translations],
      ]}
    >
      <KeywordFacet
        title="Descriptores"
        buckets={buckets}
        selected={selected}
        onToggle={onToggle}
        onModeChange={onModeChange}
        mode={mode}
        lookup={lookup}
        alwaysSearch={alwaysSearch}
      />
    </TestAtomStoreProvider>
  );
  return { onToggle, onModeChange };
};

describe('KeywordFacet', () => {
  it('caps the list and loads more options', async () => {
    const user = userEvent.setup();
    renderFacet();

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 10')).toBeInTheDocument();
    expect(screen.queryByText('Option 11')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Load more/i }));
    expect(screen.getByText('Option 12')).toBeInTheDocument();
  });

  it('filters options locally when searching', async () => {
    const user = userEvent.setup();
    renderFacet();

    const search = screen.getByRole('searchbox');
    await user.clear(search);
    await user.paste('opt-12');
    expect(screen.getByText('Option 12')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 10')).not.toBeInTheDocument();
  });

  it('toggles AND / OR', async () => {
    const user = userEvent.setup();
    const { onModeChange } = renderFacet({ mode: 'or' });

    await user.click(screen.getByRole('button', { name: 'AND' }));
    expect(onModeChange).toHaveBeenCalledWith('and');
  });

  it('shows an entity icon beside the option', () => {
    renderFacet({
      buckets: [
        {
          id: 'e1',
          label: 'Test1',
          count: 1,
          icon: { _id: 'star', type: 'Icons', label: 'Star' },
        },
      ],
    });
    expect(screen.getByTestId('fa-icon')).toHaveTextContent('star');
  });

  it('queries a lookup instead of filtering locally', async () => {
    const user = userEvent.setup();
    const lookup = jest.fn(async (searchTerm: string) => ({
      buckets: [{ id: `hit-${searchTerm}`, label: `Hit ${searchTerm}`, count: 3 }],
      total: 1,
    }));
    renderFacet({ lookup, alwaysSearch: true, buckets: [] });

    await waitFor(() => expect(lookup).toHaveBeenCalledWith(''));
    await user.type(screen.getByRole('searchbox'), 'court');
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('court'));
    expect(await screen.findByText('Hit court')).toBeInTheDocument();
  });
});
