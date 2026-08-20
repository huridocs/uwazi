import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { Provider, createStore } from 'jotai';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';
import { LibraryView } from '#V2/Routes/Library/Components/LibraryView.js';
import type { Chip } from '#V2/Routes/Library/Components/LibraryToolbar.js';
import type { LibraryFiltersState, LibraryViewMode } from '#V2/Routes/Library/libraryUrlState.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { Aggregations } from '#shared/types/aggregations.js';

const aggregations: Aggregations = {
  all: {
    _published: {
      buckets: [
        { key: 'true', filtered: { doc_count: 2 } },
        { key: 'false', filtered: { doc_count: 1 } },
      ],
    },
    _types: {
      buckets: [
        { key: 'template1', filtered: { doc_count: 2 } },
        { key: 'template2', filtered: { doc_count: 1 } },
      ],
    },
  },
};

const rows: Entity[] = [
  {
    _id: '1',
    sharedId: 'case-1',
    language: 'en',
    title: 'The State v. Example',
    template: 'template1',
    creationDate: 1,
    user: 'u1',
    documents: [{ _id: 'd1', filename: '1.pdf', type: 'document', mimetype: 'application/pdf' }],
    metadata: { country: [{ value: 'ES', label: 'Spain' }] },
  },
  {
    _id: '2',
    sharedId: 'person-1',
    language: 'en',
    title: 'Person 1',
    template: 'template2',
    creationDate: 2,
    user: 'u1',
    metadata: { country: [{ value: 'FR', label: 'France' }] },
  },
];

const LibraryPreview = () => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);
  store.set(settingsAtom, {});
  store.set(userAtom, { _id: 'admin1', role: 'admin', email: 'admin@uwazi.io', username: 'admin' });

  const [search, setSearch] = useState('');
  const [view, setView] = useState<LibraryViewMode>('cards');
  const [filters, setFilters] = useState<LibraryFiltersState>({});
  const [selectedId, setSelectedId] = useState<string>();

  const chips = useMemo((): Chip[] => {
    const items: Chip[] = [];
    Object.entries(filters).forEach(([key, values]) => {
      values.forEach(value => {
        items.push({
          key: `${key}:${value}`,
          label: value,
          onRemove: () =>
            setFilters(current => {
              const next = {
                ...current,
                [key]: (current[key] ?? []).filter(item => item !== value),
              };
              if (!next[key]?.length) {
                delete next[key];
              }
              return next;
            }),
        });
      });
    });
    return items;
  }, [filters]);

  return (
    <BrowserRouter>
      <Provider store={store}>
        <div className="tw-content h-[40rem] overflow-hidden border border-border">
          <LibraryView
            rows={rows}
            totalRows={80}
            aggregations={aggregations}
            search={search}
            onSearchChange={setSearch}
            view={view}
            onViewChange={setView}
            sort="creationDate"
            order="desc"
            onSortChange={() => undefined}
            filters={filters}
            onFiltersChange={setFilters}
            chips={chips}
            selectedId={selectedId}
            onSelect={setSelectedId}
            entityBasePath="/entityv2"
            onLoadMore={() => undefined}
          />
        </div>
      </Provider>
    </BrowserRouter>
  );
};

const meta: Meta<typeof LibraryPreview> = {
  title: 'Library/Library',
  component: LibraryPreview,
};

type Story = StoryObj<typeof LibraryPreview>;

const Composition: Story = {};

export default meta;
export { Composition };
