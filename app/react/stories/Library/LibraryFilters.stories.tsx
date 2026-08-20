import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Provider, createStore } from 'jotai';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';
import { LibraryFilters } from '#V2/Routes/Library/Components/LibraryFilters.js';
import type { LibraryFiltersState } from '#V2/Routes/Library/libraryUrlState.js';
import type { Aggregations } from '#shared/types/aggregations.js';

const aggregations: Aggregations = {
  all: {
    _published: {
      buckets: [
        { key: 'true', filtered: { doc_count: 12 } },
        { key: 'false', filtered: { doc_count: 3 } },
      ],
    },
    _types: {
      buckets: [
        { key: 'template1', filtered: { doc_count: 8 }, label: 'Documents' },
        { key: 'template2', filtered: { doc_count: 7 }, label: 'Person' },
      ],
    },
    country: {
      buckets: [
        { key: 'ES', filtered: { doc_count: 5 }, label: 'Spain' },
        { key: 'FR', filtered: { doc_count: 4 }, label: 'France' },
      ],
    },
  },
};

const FiltersPreview = () => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);
  store.set(settingsAtom, {});
  store.set(userAtom, { _id: 'admin1', role: 'admin', email: 'admin@uwazi.io', username: 'admin' });
  const [filters, setFilters] = useState<LibraryFiltersState>({});

  return (
    <Provider store={store}>
      <div className="tw-content h-[32rem] w-80 border border-border">
        <LibraryFilters aggregations={aggregations} filters={filters} onChange={setFilters} />
      </div>
    </Provider>
  );
};

const meta: Meta<typeof FiltersPreview> = {
  title: 'Library/LibraryFilters',
  component: FiltersPreview,
};

type Story = StoryObj<typeof FiltersPreview>;

const Basic: Story = {};

export default meta;
export { Basic };
