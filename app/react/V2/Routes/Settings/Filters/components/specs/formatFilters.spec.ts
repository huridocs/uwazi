import { formatFilters } from '../helpers.js';

describe('formatFilters', () => {
  it('should use _id as rowId', () => {
    expect(formatFilters([{ _id: 'subdoc1', id: 'template1', name: 'Cases' }])).toEqual([
      { _id: 'subdoc1', id: 'template1', name: 'Cases', rowId: 'subdoc1' },
    ]);
  });

  it('should use item id as subRow rowId', () => {
    expect(
      formatFilters([
        {
          _id: 'group-subdoc',
          id: 'group1',
          name: 'Group',
          items: [{ id: 'template2', name: 'People' }],
        },
      ])
    ).toEqual([
      {
        _id: 'group-subdoc',
        id: 'group1',
        name: 'Group',
        items: [{ id: 'template2', name: 'People' }],
        rowId: 'group-subdoc',
        subRows: [{ id: 'template2', name: 'People', rowId: 'template2' }],
      },
    ]);
  });
});
