import { Translation } from '../Translation';

describe('Translation', () => {
  it('should throw an error if context.id is not a string', async () => {
    expect(
      () =>
        new Translation('key', 'value', 'es', {
          id: { value: 'invalid_id' },
          type: 'Entity',
          label: 'Entity',
        })
    ).toThrowError(new Error('context.id is of type "object", should be a string'));
  });
});
