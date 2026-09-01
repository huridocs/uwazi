import { buildLanguageSwitchUrl } from '#V2/Components/UI/Header/buildLanguageSwitchUrl.js';

describe('buildLanguageSwitchUrl', () => {
  it('preserves entity main tab search', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/entity/abc',
        search: '?m=relationships',
        hash: '',
        languageKey: 'es',
      })
    ).toBe('/es/entity/abc?m=relationships');
  });

  it('preserves entity side tab hash', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/entity/abc',
        search: '',
        hash: '#s=relationships',
        languageKey: 'es',
      })
    ).toBe('/es/entity/abc#s=relationships');
  });

  it('preserves entity main tab search and side tab hash', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/entity/abc',
        search: '?m=relationships',
        hash: '#s=relationships',
        languageKey: 'es',
      })
    ).toBe('/es/entity/abc?m=relationships#s=relationships');
  });

  it('drops search on document paths and keeps hash', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/document/abc',
        search: '?page=2&file=x.pdf',
        hash: '#s=relationships',
        languageKey: 'es',
      })
    ).toBe('/es/document/abc#s=relationships');
  });

  it('strips page from search and keeps other params', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/library',
        search: '?q=(searchTerm:%27asd%27)&page=2',
        hash: '',
        languageKey: 'es',
      })
    ).toBe('/es/library?q=(searchTerm:%27asd%27)');
  });

  it('keeps library q without page', () => {
    expect(
      buildLanguageSwitchUrl({
        pathname: '/en/library',
        search: '?q=(searchTerm:%27asd%27)',
        hash: '',
        languageKey: 'es',
      })
    ).toBe('/es/library?q=(searchTerm:%27asd%27)');
  });
});
