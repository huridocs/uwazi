/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { Template } from '#app/apiResponseTypes.js';
import { LibraryFilters } from '../LibraryFilters.js';

const filterTemplates = [
  {
    ...templates[0],
    properties: [
      {
        _id: 'p-country',
        name: 'country',
        label: 'Country',
        type: 'select',
        filter: true,
        defaultfilter: true,
      },
      {
        _id: 'p-tags',
        name: 'descriptores',
        label: 'Descriptores',
        type: 'multiselect',
        filter: true,
        defaultfilter: true,
      },
      {
        _id: 'p-causa',
        name: 'causa',
        label: 'Causa',
        type: 'nested',
        filter: true,
        nestedProperties: ['numero', 'fecha'],
      },
      {
        _id: 'p-hidden',
        name: 'not_a_filter',
        label: 'Not a filter',
        type: 'select',
        filter: false,
      },
    ],
  },
] as Template[];

const aggregations: LibraryAggregations = {
  templates: [{ id: 'template1', count: 2 }],
  published: { published: 2, restricted: 1 },
  properties: {
    country: [
      {
        id: 'any',
        label: 'Any',
        count: 4,
      },
      {
        id: 'eu',
        label: 'Europe',
        count: 3,
        values: [{ id: 'ES', label: 'Spain', count: 1 }],
      },
    ],
    causa: [
      {
        id: 'numero',
        label: 'numero',
        count: 4,
        values: [{ id: '1.1', label: '1.1', count: 4 }],
      },
    ],
    not_a_filter: [{ id: 'x', label: 'Should not show', count: 9 }],
    empty_filter: [],
    descriptores: [
      { id: 'd1', label: 'Amenazas', count: 8 },
      { id: 'd4', label: 'Desaparición', count: 3 },
    ],
  },
};

const renderFilters = ({
  onChange = jest.fn(),
  onAndFiltersChange = jest.fn(),
  chips = [],
  filterState = { type: ['template1'] },
  andFilters = [],
  aggs = aggregations,
}: {
  onChange?: jest.Mock;
  onAndFiltersChange?: jest.Mock;
  chips?: { key: string; label: string; onRemove: () => void }[];
  filterState?: Record<string, string[]>;
  andFilters?: string[];
  aggs?: LibraryAggregations;
} = {}) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, filterTemplates],
        [translationsAtom, translations],
        [userAtom, { _id: 'admin1', role: 'admin', username: 'admin' }],
      ]}
    >
      <LibraryFilters
        aggregations={aggs}
        filters={filterState}
        andFilters={andFilters}
        onChange={onChange}
        onAndFiltersChange={onAndFiltersChange}
        chips={chips}
      />
    </TestAtomStoreProvider>
  );

describe('LibraryFilters', () => {
  it('collapses and expands facet cards', async () => {
    const user = userEvent.setup();
    renderFilters();

    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('Restricted')).not.toBeInTheDocument();
    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('lists applied filters in the active filters sheet', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onAndFiltersChange = jest.fn();
    const onRemove = jest.fn();
    renderFilters({
      onChange,
      onAndFiltersChange,
      chips: [{ key: 'type:template1', label: 'Type: Documents', onRemove }],
    });

    expect(screen.getByText('Active filters')).toBeInTheDocument();
    expect(screen.getByText('Type: Documents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith({});
    expect(onAndFiltersChange).toHaveBeenCalledWith([]);
  });

  it('clears active filters from the footer', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onAndFiltersChange = jest.fn();
    renderFilters({ onChange, onAndFiltersChange });

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({});
    expect(onAndFiltersChange).toHaveBeenCalledWith([]);
  });

  it('only shows Use as filter properties that have aggregations', () => {
    renderFilters();

    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Causa')).toBeInTheDocument();
    expect(screen.queryByText('Not a filter')).not.toBeInTheDocument();
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('renders thesaurus groups as one filter with expandable children', async () => {
    const user = userEvent.setup();
    renderFilters();

    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.queryByText('Spain')).not.toBeInTheDocument();

    const [countryExpand] = screen.getAllByRole('button', { name: 'Expand' });
    await user.click(countryExpand);
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(document.querySelector('[aria-hidden].w-px')).toBeInTheDocument();
  });

  it('pins Any at the bottom of a subcategory filter, without a chevron', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderFilters({ onChange });

    expect(screen.getAllByText(/^(Europe|Spain|Any)$/).map(node => node.textContent)).toEqual([
      'Europe',
      'Any',
    ]);
    expect(screen.queryByRole('button', { name: 'Collapse' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);
    expect(screen.getAllByText(/^(Europe|Spain|Any)$/).map(node => node.textContent)).toEqual([
      'Europe',
      'Spain',
      'Any',
    ]);

    await user.click(screen.getByText('Any'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ country: ['any'] }));
  });

  it('renders a nested property as one filter with subcategories', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderFilters({ onChange });

    expect(screen.getByText('Causa')).toBeInTheDocument();
    expect(screen.getByText('numero')).toBeInTheDocument();

    const expands = screen.getAllByRole('button', { name: 'Expand' });
    await user.click(expands[1]!);
    await user.click(screen.getByText('1.1'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ 'causa.numero': ['1.1'], type: ['template1'] })
    );
  });

  it('writes AND mode for a multiselect onto onAndFiltersChange', async () => {
    const user = userEvent.setup();
    const onAndFiltersChange = jest.fn();
    renderFilters({ onAndFiltersChange });

    expect(screen.getByText('Descriptores')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'AND' }));
    expect(onAndFiltersChange).toHaveBeenCalledWith(['descriptores']);
  });

  it('does not show AND/OR on a select property', () => {
    renderFilters();
    const andButtons = screen.getAllByRole('button', { name: 'AND' });
    expect(andButtons).toHaveLength(1);
  });
});
