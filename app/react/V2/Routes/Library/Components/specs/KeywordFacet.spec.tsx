/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { KeywordFacet } from '../KeywordFacet.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';

const manyBuckets: LibraryFacetBucket[] = Array.from({ length: 12 }, (_, index) => ({
  id: `opt-${index + 1}`,
  label: `Option ${index + 1}`,
  count: 12 - index,
}));

const renderFacet = (
  props: Partial<React.ComponentProps<typeof KeywordFacet>> & {
    buckets?: LibraryFacetBucket[];
    selected?: string[];
  } = {}
) => {
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
        buckets={props.buckets ?? manyBuckets}
        selected={props.selected ?? []}
        onToggle={onToggle}
        onModeChange={onModeChange}
        {...props}
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
