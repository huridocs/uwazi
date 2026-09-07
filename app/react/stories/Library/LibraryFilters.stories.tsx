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
import type { LibraryAggregations } from '#shared/types/librarySearch.js';

const aggregations: LibraryAggregations = {
  templates: [
    { id: 'template1', count: 8 },
    { id: 'template2', count: 7 },
  ],
  published: { published: 12, restricted: 3 },
  properties: {
    country: [
      { id: 'ES', label: 'Spain', count: 5 },
      { id: 'FR', label: 'France', count: 4 },
    ],
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
