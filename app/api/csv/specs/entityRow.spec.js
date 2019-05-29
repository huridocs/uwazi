import { extractEntity } from '../entityRow';

describe('entityRow', () => {
  const languages = ['es', 'en', 'pt'];
  const currentLanguage = 'en';

  it('should return entity for the current language', () => {
    const { rawEntity } = extractEntity({
      title__es: 'test_es',
      title__en: 'test_en',
    }, languages, currentLanguage);

    expect(rawEntity).toEqual({ title: 'test_en', language: 'en' });
  });

  it('should return translations for languages that have it', () => {
    const { rawTranslations } = extractEntity({
      title__es: 'test_es',
      title__en: 'test_en',
    }, languages, currentLanguage);

    expect(rawTranslations).toEqual(
      [{ title: 'test_es', language: 'es' }]
    );
  });

  it('should return translations for languages that have values not blank', () => {
    const { rawTranslations } = extractEntity({
      title__es: 'test_es',
      title__en: 'test_en',
      title__pt: ' ',
    }, languages, currentLanguage);

    expect(rawTranslations).toEqual(
      [{ title: 'test_es', language: 'es' }]
    );
  });

  it('should return all translations when everything is translated', () => {
    const { rawTranslations } = extractEntity({
      title__es: 'test_es',
      title__en: 'test_en',
      text__pt: 'text_pt',
    }, languages, currentLanguage);

    expect(rawTranslations).toEqual([
      { title: 'test_es', language: 'es' },
      { text: 'text_pt', language: 'pt' },
    ]);
  });
});
