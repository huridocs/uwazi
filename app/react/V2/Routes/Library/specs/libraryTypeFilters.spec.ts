import type { ClientSettingsFilterSchema, Template } from '#app/apiResponseTypes.js';
import { toggleTypeGroup, typeFilterItems } from '../libraryTypeFilters.js';

const templates = [
  { _id: 'template2', name: 'Person' },
  { _id: 'template1', name: 'Documents' },
  { _id: 'template3', name: 'Country' },
] as Template[];

const settingsFilters: ClientSettingsFilterSchema[] = [
  { id: 'template1', name: 'Documents' },
  {
    id: 'group-legal',
    name: 'Legal',
    items: [
      { id: 'template2', name: 'Person' },
      { id: 'template3', name: 'Country' },
    ],
  },
];

describe('libraryTypeFilters', () => {
  it('lists settings.filters (including groups) when they are configured', () => {
    expect(typeFilterItems(settingsFilters, templates)).toEqual([
      { id: 'template1', name: 'Documents' },
      {
        id: 'group-legal',
        name: 'Legal',
        items: [
          { id: 'template2', name: 'Person' },
          { id: 'template3', name: 'Country' },
        ],
      },
    ]);
  });

  it('lists every template alphabetically when settings.filters is empty', () => {
    expect(typeFilterItems([], templates).map(item => item.id)).toEqual([
      'template3',
      'template1',
      'template2',
    ]);
  });

  it('selects or clears every child id of a type group', () => {
    expect(toggleTypeGroup(['template1'], ['template2', 'template3'])).toEqual([
      'template1',
      'template2',
      'template3',
    ]);
    expect(
      toggleTypeGroup(['template1', 'template2', 'template3'], ['template2', 'template3'])
    ).toEqual(['template1']);
  });
});
