import { LanguageTranslator } from '../LanguageTranslator.js';

describe('LanguageTranslator', () => {
  it.each([
    ['eng', 'en'],
    ['spa', 'es'],
    ['fra', 'fr'],
  ])('should translate %s to the service code %s', (iso6393, expected) => {
    expect(LanguageTranslator.toService(iso6393)).toBe(expected);
  });

  it.each([['other'], ['zzz'], ['']])('should have no service code for %p', language => {
    expect(LanguageTranslator.toService(language)).toBeUndefined();
  });
});
