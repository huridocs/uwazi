import { validateHomePageRoute } from '../routeHelpers';

describe('validateHomePageRoute', () => {
  it('should validate /library', () => {
    expect(validateHomePageRoute('/library')).toBe(true);
    expect(validateHomePageRoute('/en/library')).toBe(true);
    expect(validateHomePageRoute('/en/library/table')).toBe(true);
    expect(validateHomePageRoute('/library/table')).toBe(true);
    expect(validateHomePageRoute('/en/library/map')).toBe(true);
    expect(validateHomePageRoute('/en/library/map?foo=bar')).toBe(true);
    expect(validateHomePageRoute('/library?foo=bar')).toBe(true);
    expect(validateHomePageRoute('/en/library?foo=bar')).toBe(true);
    expect(validateHomePageRoute('/library/?foo=bar')).toBe(true);

    expect(validateHomePageRoute('/libraryfoo=bar')).toBe(false);
  });
  it('should validate /page', () => {
    expect(validateHomePageRoute('/page/asd2dad2')).toBe(true);
    expect(validateHomePageRoute('/en/page/asd2dad2')).toBe(true);
    expect(validateHomePageRoute('/en/page/asd2dad2/the-foo-bar')).toBe(true);

    expect(validateHomePageRoute('/page')).toBe(false);
    expect(validateHomePageRoute('/page/')).toBe(false);
    expect(validateHomePageRoute('/en/page')).toBe(false);
    expect(validateHomePageRoute('/page?foo=bar')).toBe(false);
  });
  it('should validate /entity', () => {
    expect(validateHomePageRoute('/entity/asd2dad2')).toBe(true);
    expect(validateHomePageRoute('/en/entity/asd2dad2')).toBe(true);
    expect(validateHomePageRoute('/en/entity/asd2dad2')).toBe(true);

    expect(validateHomePageRoute('/entity')).toBe(false);
    expect(validateHomePageRoute('/en/entity')).toBe(false);
    expect(validateHomePageRoute('/en/entity/')).toBe(false);
    expect(validateHomePageRoute('/entity?foo=bar')).toBe(false);
  });
  it('should return false for home', () => {
    expect(validateHomePageRoute('/')).toBe(false);
    expect(validateHomePageRoute('?')).toBe(false);
    expect(validateHomePageRoute('/es/')).toBe(false);
  });
  it('should return false for unexisting or not whitelisted', () => {
    expect(validateHomePageRoute('/es/foo')).toBe(false);
    expect(validateHomePageRoute('/foo')).toBe(false);
    expect(validateHomePageRoute('/settings')).toBe(false);
  });
});
