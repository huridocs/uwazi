import { applyCopyFromMetadata } from '../applyCopyFromMetadata.js';

describe('applyCopyFromMetadata', () => {
  it('overwrites matching fields from the source and leaves the rest unchanged', () => {
    const next = applyCopyFromMetadata({
      currentMetadata: {
        one: [{ value: 'number one' }],
        two: [{ value: 'number wrong' }],
      },
      sourceMetadata: {
        two: [{ value: 'number two' }],
        three: [{ value: 'number three' }],
      },
      matchingProperties: [{ name: 'two', type: 'text', label: 'Two' }],
    });

    expect(next).toEqual({
      one: [{ value: 'number one' }],
      two: [{ value: 'number two' }],
    });
  });

  it('copies empty values when the source has no metadata for a matching field', () => {
    const next = applyCopyFromMetadata({
      currentMetadata: { description: [{ value: 'keep me' }], region: [{ value: 'North' }] },
      sourceMetadata: {},
      matchingProperties: [{ name: 'region', type: 'select', label: 'Region' }],
    });

    expect(next).toEqual({
      description: [{ value: 'keep me' }],
      region: [],
    });
  });
});
