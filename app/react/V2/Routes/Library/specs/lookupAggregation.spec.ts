import { bucketsFromLookupOptions } from '../lookupAggregation.js';

describe('bucketsFromLookupOptions', () => {
  it('keeps an entity icon from the lookup option', () => {
    expect(
      bucketsFromLookupOptions([
        {
          value: 'e1',
          label: 'Test1',
          results: 1,
          icon: { _id: 'star', type: 'Icons', label: 'Star' },
        },
      ])
    ).toEqual([
      {
        id: 'e1',
        label: 'Test1',
        count: 1,
        icon: { _id: 'star', type: 'Icons', label: 'Star' },
      },
    ]);
  });
});
