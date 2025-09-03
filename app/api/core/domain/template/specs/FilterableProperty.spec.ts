import { FilterableProperty } from '../FilterableProperty';

class Testing extends FilterableProperty {}

describe('FilterableProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new Testing({
      id: 'any_id',
      label: 'A Title',
      type: 'text',
    });

    expect(property).toMatchObject({
      filter: false,
      defaultfilter: false,
      prioritySorting: false,
    });
  });
});
