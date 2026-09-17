/**
 * @jest-environment jsdom
 */
import type { Template } from '#app/apiResponseTypes.js';
import {
  DEFAULT_VISIBLE_COLUMN_IDS,
  isColumnVisible,
  libraryTableColumns,
  propertyMatchKey,
  toggleColumnVisibility,
  visibleLibraryTableColumns,
} from '../libraryTableColumns.js';

const templates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    color: '#6a5acd',
    properties: [
      {
        _id: 'p1',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'thesaurus-countries',
      },
      { _id: 'p2', name: 'type', label: 'Type', type: 'select', content: 'thesaurus-types' },
      { _id: 'p3', name: 'location', label: 'Location', type: 'geolocation' },
      { _id: 'p4', name: 'video', label: 'Video', type: 'media' },
    ],
  },
  {
    _id: 'tpl-person',
    name: 'Person',
    color: '#faca15',
    properties: [
      {
        _id: 'p5',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'thesaurus-countries',
      },
      { _id: 'p6', name: 'role', label: 'Role', type: 'text' },
    ],
  },
  {
    _id: 'tpl-event',
    name: 'Event',
    color: '#2b8a3e',
    properties: [
      { _id: 'p7', name: 'country', label: 'Country', type: 'select', content: 'thesaurus-other' },
      { _id: 'p8', name: 'date', label: 'Event date', type: 'date' },
    ],
  },
] as Template[];

describe('libraryTableColumns', () => {
  it('flattens grouped columns without duplicating equal properties', () => {
    expect(
      libraryTableColumns(templates, ['tpl-org', 'tpl-person']).map(column => column.id)
    ).toEqual([
      'title',
      'template',
      'creationDate',
      'editDate',
      'country',
      'type',
      'location',
      'video',
      'role',
    ]);
  });

  it('keeps same-name properties as separate columns when they are not equal', () => {
    const columns = libraryTableColumns(templates, ['tpl-person', 'tpl-event']);
    expect(
      columns.filter(column => column.id === 'country').map(column => column.matchKey)
    ).toEqual([
      propertyMatchKey({
        name: 'country',
        type: 'select',
        content: 'thesaurus-countries',
      }),
      propertyMatchKey({
        name: 'country',
        type: 'select',
        content: 'thesaurus-other',
      }),
    ]);
  });

  it('omits properties from templates that are not selected', () => {
    expect(libraryTableColumns(templates, ['tpl-person']).map(column => column.id)).toEqual([
      'title',
      'template',
      'creationDate',
      'editDate',
      'country',
      'role',
    ]);
  });

  it('keeps extraVisible marked when the column is temporarily out of scope', () => {
    const roleKey = propertyMatchKey({ name: 'role', type: 'text' });
    const shown = toggleColumnVisibility(roleKey, {
      density: 'compact',
      hidden: [],
      extraVisible: [],
    });
    expect(isColumnVisible(roleKey, shown)).toBe(true);
    expect(libraryTableColumns(templates, ['tpl-org']).some(column => column.id === 'role')).toBe(
      false
    );
    expect(
      libraryTableColumns(templates, ['tpl-person']).some(column => column.id === 'role')
    ).toBe(true);
  });

  it('hides unselected built-ins and keeps selected extras without forcing the four defaults', () => {
    const columns = libraryTableColumns(templates, ['tpl-org', 'tpl-person']);
    const countryKey = propertyMatchKey({
      name: 'country',
      type: 'select',
      content: 'thesaurus-countries',
    });
    const hiddenBuiltins = {
      density: 'compact' as const,
      hidden: ['title', 'template', 'creationDate', 'editDate'],
      extraVisible: [],
    };

    expect(visibleLibraryTableColumns(columns, hiddenBuiltins).map(column => column.id)).toEqual(
      []
    );

    const withCountry = toggleColumnVisibility(countryKey, hiddenBuiltins);
    expect(visibleLibraryTableColumns(columns, withCountry).map(column => column.id)).toEqual([
      'country',
    ]);

    const defaultVisible = visibleLibraryTableColumns(columns, {
      density: 'compact',
      hidden: [],
      extraVisible: [],
    }).map(column => column.id);
    expect(defaultVisible).toEqual(['title', 'template', 'creationDate', 'editDate']);

    const titleHidden = toggleColumnVisibility('title', {
      density: 'compact',
      hidden: [],
      extraVisible: [countryKey],
    });
    expect(visibleLibraryTableColumns(columns, titleHidden).map(column => column.id)).toEqual([
      'template',
      'creationDate',
      'editDate',
      'country',
    ]);
  });

  it('defaults built-ins to visible and template properties to hidden', () => {
    const display = { density: 'compact' as const, hidden: [], extraVisible: [] };
    expect(isColumnVisible('title', display)).toBe(true);
    expect(isColumnVisible('country', display)).toBe(false);
    expect([...DEFAULT_VISIBLE_COLUMN_IDS]).toEqual([
      'title',
      'template',
      'creationDate',
      'editDate',
    ]);
  });

  it('toggles built-in and extra columns independently', () => {
    const hiddenTitle = toggleColumnVisibility('title', {
      density: 'compact',
      hidden: [],
      extraVisible: [],
    });
    expect(isColumnVisible('title', hiddenTitle)).toBe(false);

    const countryKey = propertyMatchKey({
      name: 'country',
      type: 'select',
      content: 'thesaurus-countries',
    });
    const showCountry = toggleColumnVisibility(countryKey, hiddenTitle);
    expect(isColumnVisible(countryKey, showCountry)).toBe(true);
    expect(isColumnVisible('title', showCountry)).toBe(false);
  });

  it('marks equal properties together and leaves unequal same-name properties alone', () => {
    const orgCountry = propertyMatchKey({
      name: 'country',
      type: 'select',
      content: 'thesaurus-countries',
    });
    const eventCountry = propertyMatchKey({
      name: 'country',
      type: 'select',
      content: 'thesaurus-other',
    });
    const shown = toggleColumnVisibility(orgCountry, {
      density: 'compact',
      hidden: [],
      extraVisible: [],
    });

    expect(isColumnVisible(orgCountry, shown)).toBe(true);
    expect(isColumnVisible(eventCountry, shown)).toBe(false);
  });

  it('gives leftover space mostly to title, then to multi-value columns', () => {
    const widths = Object.fromEntries(
      libraryTableColumns(templates, ['tpl-org']).map(column => [column.id, column.width])
    );

    expect(widths.title).toBe('minmax(16rem, 3fr)');
    expect(widths.template).toBe('minmax(8rem, 0.8fr)');
    expect(widths.creationDate).toBe('minmax(9rem, 0.9fr)');
    expect(widths.editDate).toBe('minmax(9rem, 0.9fr)');
    expect(widths.country).toBe('minmax(8rem, 1fr)');
    expect(widths.location).toBe('minmax(12rem, 1.6fr)');
  });

  it('only marks filterable text, date, numeric and select columns as sortable', () => {
    const sortableTemplates = [
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
          {
            _id: 'p5',
            name: 'linked_date',
            label: 'Linked date',
            type: 'relationship',
            filter: true,
            inherit: { property: 'other', type: 'date' },
          },
        ],
      },
    ] as Template[];

    const sortKeys = Object.fromEntries(
      libraryTableColumns(sortableTemplates, ['tpl-org']).map(column => [column.id, column.sortKey])
    );

    expect(sortKeys).toEqual({
      title: 'title',
      template: undefined,
      creationDate: 'creationDate',
      editDate: 'editDate',
      country: 'metadata.country',
      type: undefined,
      location: undefined,
      role: 'metadata.role',
      linked_date: 'metadata.linked_date.inheritedValue',
    });
  });
});
