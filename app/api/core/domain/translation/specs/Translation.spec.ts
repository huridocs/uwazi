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

  it('should create one row per key and language', () => {
    const context: TranslationContext = { id: 'ctx', label: 'Context', type: 'Entity' };

    expect(
      Translation.forLanguages(context, { Title: 'Title', Name: 'Nombre' }, ['en', 'es'])
    ).toEqual([
      new Translation('Title', 'Title', 'en', context),
      new Translation('Name', 'Nombre', 'en', context),
      new Translation('Title', 'Title', 'es', context),
      new Translation('Name', 'Nombre', 'es', context),
    ]);
  });
});
