import { extractEntity } from '../entityRow';

describe('entityRow', () => {
  const languages = ['es', 'en', 'pt'];
  const currentLanguage = 'en';
  const defaultLanguage = 'en';

  it('should return entity for the current language (not missinterpreting coincidences in letters as language escaping)', () => {
    const { rawEntity } = extractEntity(
      {
        title__es: 'test_es',
        title__en: 'test_en',
        not_portuguese_ptescaped_property: 'not portuguese',
      },
      languages,
      currentLanguage,
      defaultLanguage,
      {}
    );

    expect(rawEntity).toEqual({
      propertiesFromColumns: {
        title: 'test_en',
        not_portuguese_ptescaped_property: 'not portuguese',
      },
      language: 'en',
    });
  });

  it('should return translations for languages that have it', () => {
    const { rawTranslations } = extractEntity(
      {
        title__es: 'test_es',
        title__en: 'test_en',
      },
      languages,
      currentLanguage,
      defaultLanguage,
      {}
    );

    expect(rawTranslations).toEqual([
      { propertiesFromColumns: { title: 'test_es' }, language: 'es' },
    ]);
  });

  it('should return translations for languages that have values not blank', () => {
    const { rawTranslations } = extractEntity(
      {
        title__es: 'test_es',
        title__en: 'test_en',
        title__pt: ' ',
      },
      languages,
      currentLanguage,
      defaultLanguage,
      {}
    );

    expect(rawTranslations).toEqual([
      { propertiesFromColumns: { title: 'test_es' }, language: 'es' },
    ]);
  });

  it('should return all translations when everything is translated', () => {
    const { rawTranslations } = extractEntity(
      {
        title__es: 'test_es',
        title__en: 'test_en',
        text__pt: 'text_pt',
      },
      languages,
      currentLanguage,
      defaultLanguage,
      {}
    );

    expect(rawTranslations).toEqual([
      { propertiesFromColumns: { title: 'test_es' }, language: 'es' },
      { propertiesFromColumns: { text: 'text_pt' }, language: 'pt' },
    ]);
  });

  it('should not missinterpret middle-word coincidences with language matches', () => {
    const { rawEntity, rawTranslations } = extractEntity(
      {
        title__es: 'test_es',
        title__en: 'test_en',
        some__entirely_new_property: 'has __en in name, but is not english',
        a__pt_property: 'not portugese',
      },
      languages,
      'es',
      defaultLanguage,
      {}
    );

    expect(rawEntity).toEqual({
      propertiesFromColumns: {
        title: 'test_es',
        some__entirely_new_property: 'has __en in name, but is not english',
        a__pt_property: 'not portugese',
      },
      language: 'es',
    });

    expect(rawTranslations).toEqual([
      {
        propertiesFromColumns: {
          title: 'test_en',
          some__entirely_new_property: 'has __en in name, but is not english',
          a__pt_property: 'not portugese',
        },
        language: 'en',
      },
    ]);
  });
});
