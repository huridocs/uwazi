import { Translation, TranslationContext } from '../Translation.js';

describe('Translation', () => {
  it('should throw an error if context.id is not a string', async () => {
    const invalidContext = {
      id: { value: 'invalid_id' },
      type: 'Entity',
      label: 'Entity',
    } as unknown as TranslationContext;

    expect(() => new Translation('key', 'value', 'es', invalidContext)).toThrowError(
      new Error('context.id is of type "object", should be a string')
    );
  });
});
