import { filterableProperties } from '../filterableProperties.js';

const templates = [
  {
    _id: 't1',
    name: 'Case',
    properties: [
      { name: 'country', type: 'select', filter: true, defaultfilter: true, content: 'c' },
      { name: 'secret', type: 'text', filter: false },
      { name: 'only_when_selected', type: 'select', filter: true, content: 'c' },
    ],
  },
  {
    _id: 't2',
    name: 'Person',
    properties: [
      { name: 'country', type: 'select', filter: true, defaultfilter: true, content: 'c' },
    ],
  },
];

describe('filterableProperties', () => {
  it('returns default Use as filter properties when no type is selected', () => {
    expect(filterableProperties(templates as never, []).map(property => property.name)).toEqual([
      'country',
    ]);
  });

  it('returns common Use as filter properties of the selected types', () => {
    expect(filterableProperties(templates as never, ['t1']).map(property => property.name)).toEqual(
      ['country', 'only_when_selected']
    );
  });
});
