import {
  createOmittedLanguages,
  readCreatedTranslations,
} from '../libraryCreatePendingTranslations.js';

describe('libraryCreatePendingTranslations', () => {
  it('lists installed languages the create did not send', () => {
    expect(createOmittedLanguages(undefined, ['en', 'es', 'fr'], 'en')).toEqual(['es', 'fr']);
    expect(
      createOmittedLanguages({ es: { title: [{ value: 'Hola' }] } }, ['en', 'es', 'fr'], 'en')
    ).toEqual(['fr']);
  });

  it('lists nothing when every other language was sent', () => {
    expect(createOmittedLanguages({ es: { title: [{ value: '' }] } }, ['en', 'es'], 'en')).toEqual(
      []
    );
    expect(createOmittedLanguages(undefined, ['en'], 'en')).toEqual([]);
  });

  it('is empty while an omitted language has no text', () => {
    expect(
      readCreatedTranslations(
        [{ language: 'en', translations: { es: { title: [{ value: '' }] } } }],
        ['es'],
        'en'
      )
    ).toEqual({ status: 'empty' });
    expect(readCreatedTranslations(undefined, ['es'], 'en')).toEqual({ status: 'empty' });
  });

  it('stops on a title that starts with (AI translation pending)', () => {
    expect(
      readCreatedTranslations(
        [
          {
            language: 'es',
            translations: { es: { title: [{ value: 'from another row' }] } },
          },
          {
            language: 'en',
            translations: {
              es: { title: [{ value: '(AI translation pending) Hola' }], summary: [{ value: '' }] },
            },
          },
        ],
        ['es'],
        'en'
      )
    ).toEqual({
      status: 'found',
      translations: { es: { title: [{ value: '(AI translation pending) Hola' }] } },
    });
  });

  it('ignores a copied source title', () => {
    expect(
      readCreatedTranslations(
        [
          {
            language: 'en',
            title: 'Panel check',
            translations: { es: { title: [{ value: 'Panel check' }] } },
          },
        ],
        ['es'],
        'en'
      )
    ).toEqual({ status: 'empty' });
  });

  it('stops when an omitted language already has text', () => {
    expect(
      readCreatedTranslations(
        [
          {
            language: 'en',
            translations: {
              es: { summary: [{ value: '(AI translated) Hola' }] },
              fr: { title: [{ value: 'Bonjour' }] },
            },
          },
        ],
        ['es'],
        'en'
      )
    ).toEqual({
      status: 'found',
      translations: { es: { summary: [{ value: '(AI translated) Hola' }] } },
    });
  });

  it('keeps a link when its label or url is pending or filled', () => {
    expect(
      readCreatedTranslations(
        [
          {
            language: 'en',
            translations: {
              es: {
                link: [{ value: { label: '(AI translation pending) Docs', url: '' } }],
              },
            },
          },
        ],
        ['es'],
        'en'
      )
    ).toEqual({
      status: 'found',
      translations: {
        es: { link: [{ value: { label: '(AI translation pending) Docs', url: '' } }] },
      },
    });
  });
});
