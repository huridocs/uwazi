/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import type { ClientTranslationSchema } from '#app/istore.js';
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
  valueContext,
  locale = 'en',
  localeTranslations = translations,
  defaultExpanded,
}: {
  buckets?: LibraryFacetBucket[];
  selected?: string[];
  mode?: FacetMode;
  lookup?: FacetLookup;
  alwaysSearch?: boolean;
  valueContext?: string;
  locale?: string;
  localeTranslations?: ClientTranslationSchema[];
  defaultExpanded?: boolean;
} = {}) => {
  const onToggle = jest.fn();
  const onModeChange = jest.fn();
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, locale],
        [translationsAtom, localeTranslations],
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
        valueContext={valueContext}
        defaultExpanded={defaultExpanded}
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

  it('shows the thesaurus value in the current language', () => {
    const spanish: ClientTranslationSchema[] = [
      {
        locale: 'es',
        contexts: [
          {
            id: 'th-countries',
            label: 'Countries',
            values: { Spain: 'España', Europe: 'Europa' },
          },
        ],
      },
    ];
    renderFacet({
      locale: 'es',
      localeTranslations: spanish,
      valueContext: 'th-countries',
      defaultExpanded: true,
      buckets: [
        {
          id: 'eu',
          label: 'Europe',
          count: 2,
          values: [{ id: 'ES', label: 'Spain', count: 1 }],
        },
      ],
    });
    expect(screen.getByText('Europa')).toBeInTheDocument();
    expect(screen.getByText('España')).toBeInTheDocument();
  });

  it('shows the related record title', () => {
    const spanish: ClientTranslationSchema[] = [
      {
        locale: 'es',
        contexts: [
          {
            id: 'System',
            label: 'System',
            values: { 'Supreme Court': 'Corte Suprema' },
          },
        ],
      },
    ];
    renderFacet({
      locale: 'es',
      localeTranslations: spanish,
      buckets: [{ id: 'org-1', label: 'Supreme Court', count: 1 }],
    });
    expect(screen.getByText('Supreme Court')).toBeInTheDocument();
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
