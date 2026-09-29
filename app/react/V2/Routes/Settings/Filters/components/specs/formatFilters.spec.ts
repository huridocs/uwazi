import { formatFilters } from '../helpers.js';

describe('formatFilters', () => {
  it('should use id as rowId and drop leftover mongoose _id', () => {
    expect(formatFilters([{ _id: 'subdoc1', id: 'template1', name: 'Cases' }])).toEqual([
      { id: 'template1', name: 'Cases', rowId: 'template1' },
    ]);
  });

  it('should use item id as subRow rowId and group id as the group rowId', () => {
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
        id: 'group1',
        name: 'Group',
        items: [{ id: 'template2', name: 'People' }],
        rowId: 'group1',
        subRows: [{ id: 'template2', name: 'People', rowId: 'template2' }],
      },
    ]);
  });
});
