import { resolveEmbedLocale } from '../resolveEmbedLocale.js';

const languages = [
  { key: 'en', default: false, label: 'English' },
  { key: 'es', default: true, label: 'Spanish' },
];

describe('resolveEmbedLocale', () => {
  it('should prefer ?locale= query param', () => {
    expect(
      resolveEmbedLocale({
        localeQuery: 'en',
        contentLanguage: 'es',
        cookieLocale: 'es',
        acceptLanguage: 'pt-BR',
        languages,
      })
    ).toBe('en');
  });

  it('should fall back to Content-Language when query is absent', () => {
    expect(
      resolveEmbedLocale({
        contentLanguage: 'en',
        cookieLocale: 'es',
        languages,
      })
    ).toBe('en');
  });

  it('should fall back to cookie locale', () => {
    expect(
      resolveEmbedLocale({
        cookieLocale: 'en',
        languages,
      })
    ).toBe('en');
  });

  it('should fall back to Accept-Language primary tag', () => {
    expect(
      resolveEmbedLocale({
        acceptLanguage: 'en-US,en;q=0.9',
        languages,
      })
    ).toBe('en');
  });

  it('should use tenant default when locale is not installed', () => {
    expect(
      resolveEmbedLocale({
        localeQuery: 'fr',
        languages,
      })
    ).toBe('es');
  });
});
