import type { Template } from '#app/apiResponseTypes.js';
import { libraryTableColumns } from '../libraryTableColumns.js';
import { effectiveLibrarySort, librarySortOptions, nextLibrarySort } from '../librarySort.js';

const templates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    properties: [
      {
        _id: 'p1',
        name: 'country',
        label: 'Country',
        type: 'select',
        filter: true,
        content: 'c',
      },
      { _id: 'p2', name: 'type', label: 'Type', type: 'select', content: 't' },
      { _id: 'p3', name: 'location', label: 'Location', type: 'geolocation', filter: true },
      { _id: 'p4', name: 'role', label: 'Role', type: 'text', filter: true },
    ],
  },
  {
    _id: 'tpl-person',
    name: 'Person',
    properties: [
      {
        _id: 'p5',
        name: 'country',
        label: 'Country',
        type: 'select',
        filter: true,
        content: 'c',
      },
      { _id: 'p6', name: 'born', label: 'Born', type: 'date', filter: true },
    ],
  },
] as Template[];

describe('librarySortOptions', () => {
  it('lists built-in sorts plus filterable template properties', () => {
    const options = librarySortOptions(libraryTableColumns(templates, []), '');
    expect(options.map(option => option.value)).toEqual([
      'title',
      'creationDate',
      'editDate',
      'metadata.country',
      'metadata.role',
      'metadata.born',
    ]);
  });

  it('scopes properties to the selected templates', () => {
    const options = librarySortOptions(libraryTableColumns(templates, ['tpl-person']), '');
    expect(options.map(option => option.value)).toEqual([
      'title',
      'creationDate',
      'editDate',
      'metadata.country',
      'metadata.born',
    ]);
  });

  it('adds relevance while searching', () => {
    const options = librarySortOptions(libraryTableColumns(templates, ['tpl-org']), 'tips');
    expect(options.at(-1)).toEqual({
      value: '_score',
      label: 'Relevance',
      translationContext: 'System',
    });
  });
});

describe('nextLibrarySort', () => {
  it('uses ascending the first time a sort is chosen', () => {
    expect(nextLibrarySort('creationDate', 'desc', 'title')).toEqual({
      sort: 'title',
      order: 'asc',
    });
  });

  it('toggles descending when the same sort is chosen again', () => {
    expect(nextLibrarySort('title', 'asc', 'title')).toEqual({ sort: 'title', order: 'desc' });
    expect(nextLibrarySort('title', 'desc', 'title')).toEqual({ sort: 'title', order: 'asc' });
  });

  it('treats an empty sort as creation date', () => {
    expect(effectiveLibrarySort('')).toBe('creationDate');
    expect(nextLibrarySort('', 'desc', 'creationDate')).toEqual({
      sort: 'creationDate',
      order: 'asc',
    });
  });
});
