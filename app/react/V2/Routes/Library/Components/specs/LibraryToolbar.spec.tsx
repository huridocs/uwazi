/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import { LibraryTableDisplayOptions, LibraryToolbar, VIEW_OPTIONS } from '../LibraryToolbar.js';
import {
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  libraryTableColumnGroups,
  libraryTableColumns,
  toggleColumnVisibility,
  type LibraryTableDisplayState,
} from '../libraryTableColumns.js';

const tableColumns = libraryTableColumns(templates, ['template1']);
const groupingTemplates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    color: '#6a5acd',
    properties: [
      { _id: 'p1', name: 'country', label: 'Country', type: 'select', content: 'c' },
      { _id: 'p2', name: 'type', label: 'Type', type: 'select', content: 't' },
    ],
  },
  {
    _id: 'tpl-person',
    name: 'Person',
    color: '#faca15',
    properties: [
      { _id: 'p3', name: 'country', label: 'Country', type: 'select', content: 'c' },
      { _id: 'p4', name: 'role', label: 'Role', type: 'text' },
    ],
  },
] as Template[];

const sortTemplates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    color: '#6a5acd',
    properties: [
      {
        _id: 'p1',
        name: 'country',
        label: 'Country',
        type: 'select' as const,
        filter: true,
        content: 'c',
      },
      {
        _id: 'p2',
        name: 'location',
        label: 'Location',
        type: 'geolocation' as const,
        filter: true,
      },
    ],
  },
] as Template[];

const sortColumns = libraryTableColumns(sortTemplates, ['tpl-org']);

const renderToolbar = (
  overrides: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    totalRows?: number;
    onSortChange?: (sort: string, order: 'asc' | 'desc') => void;
  } = {}
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, sortTemplates],
        [translationsAtom, translations],
      ]}
    >
      <LibraryToolbar
        search={overrides.search ?? ''}
        onSearchChange={() => undefined}
        view="cards"
        onViewChange={() => undefined}
        sort={overrides.sort ?? 'creationDate'}
        order={overrides.order ?? 'desc'}
        onSortChange={overrides.onSortChange ?? (() => undefined)}
        totalRows={overrides.totalRows ?? 0}
        showThumbnail
        onShowThumbnailChange={() => undefined}
        showMetadata
        onShowMetadataChange={() => undefined}
        tableColumns={sortColumns}
      />
    </TestAtomStoreProvider>
  );

describe('LibraryToolbar view options', () => {
  it('offers cards, map and table only', () => {
    expect(VIEW_OPTIONS.map(option => option.value)).toEqual(['cards', 'map', 'table']);
  });
});

describe('LibraryToolbar entity count', () => {
  it('shows the formatted search result total next to the search bar', () => {
    renderToolbar({ totalRows: 4396 });
    const count = screen.getByTestId('library-entity-count');
    expect(count).toHaveTextContent('4,396');
    expect(count).toHaveTextContent('entities');
    const search = screen.getByRole('textbox', { name: 'Search' });
    expect(search.parentElement?.parentElement).toContainElement(count);
  });

  it('places sort and view in a trailing controls group', () => {
    renderToolbar({ totalRows: 12 });
    const controls = screen.getByTestId('library-toolbar-controls');
    expect(controls).toContainElement(screen.getByRole('button', { name: 'Sort' }));
    expect(controls).toContainElement(screen.getByRole('button', { name: 'View' }));
    expect(controls).not.toContainElement(screen.getByTestId('library-entity-count'));
  });
});

describe('LibraryToolbar sort', () => {
  it('lists built-in and filterable template properties', () => {
    renderToolbar();
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
    expect(screen.getByRole('option', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Creation date' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Country' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Location' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Relevance' })).not.toBeInTheDocument();
  });

  it('includes relevance while searching', () => {
    renderToolbar({ search: 'tips' });
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
    expect(screen.getByRole('option', { name: 'Relevance' })).toBeInTheDocument();
  });

  it('selects a new sort ascending', () => {
    const onSortChange = jest.fn();
    renderToolbar({ sort: 'creationDate', order: 'desc', onSortChange });
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
    fireEvent.click(screen.getByRole('option', { name: 'Title' }));
    expect(onSortChange).toHaveBeenCalledWith('title', 'asc');
  });

  it('toggles the same sort option to descending', () => {
    const onSortChange = jest.fn();
    renderToolbar({ sort: 'title', order: 'asc', onSortChange });
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
    fireEvent.click(screen.getByRole('option', { name: 'Title' }));
    expect(onSortChange).toHaveBeenCalledWith('title', 'desc');
  });

  it('shows an arrow for the current sort direction', () => {
    renderToolbar({ sort: 'title', order: 'asc' });
    expect(screen.getByTestId('sort-direction-asc')).toBeInTheDocument();
    expect(screen.queryByTestId('sort-direction-desc')).not.toBeInTheDocument();
  });
});

describe('LibraryTableDisplayOptions', () => {
  it('toggles columns and density', () => {
    const onToggleColumn = jest.fn();
    const onDensityChange = jest.fn();
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <LibraryTableDisplayOptions
          columns={tableColumns}
          display={DEFAULT_LIBRARY_TABLE_DISPLAY}
          onToggleColumn={onToggleColumn}
          onDensityChange={onDensityChange}
        />
      </TestAtomStoreProvider>
    );
    expect(screen.getByText('Columns')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Title' }));
    expect(onToggleColumn).toHaveBeenCalledWith('title');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Comfortable/ }));
    expect(onDensityChange).toHaveBeenCalledWith('comfortable');
  });

  it('lists every template property and checks equal properties together', () => {
    const InteractiveOptions = () => {
      const [display, setDisplay] = useState<LibraryTableDisplayState>(
        DEFAULT_LIBRARY_TABLE_DISPLAY
      );
      return (
        <LibraryTableDisplayOptions
          columns={libraryTableColumns(groupingTemplates, ['tpl-org', 'tpl-person'])}
          groups={libraryTableColumnGroups(groupingTemplates, ['tpl-org', 'tpl-person'])}
          display={display}
          onToggleColumn={id => setDisplay(current => toggleColumnVisibility(id, current))}
        />
      );
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, groupingTemplates],
          [translationsAtom, translations],
        ]}
      >
        <InteractiveOptions />
      </TestAtomStoreProvider>
    );

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
    const countryChecks = screen.getAllByRole('menuitemcheckbox', { name: 'Country' });
    expect(countryChecks).toHaveLength(2);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Role' })).toBeInTheDocument();

    fireEvent.click(countryChecks[0]!);
    screen.getAllByRole('menuitemcheckbox', { name: 'Country' }).forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  });
});
