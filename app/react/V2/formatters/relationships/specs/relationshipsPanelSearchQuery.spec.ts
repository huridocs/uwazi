import { buildMatcher } from '../relationshipsPanelSearchQuery.js';

describe('relationshipsPanelSearchQuery', () => {
  const haystack = 'Alpha snippet Zebra relA';

  it('matches substring terms', () => {
    expect(buildMatcher('alpha')?.(haystack)).toBe(true);
    expect(buildMatcher('missing')?.(haystack)).toBe(false);
  });

  it('matches exact phrases', () => {
    expect(buildMatcher('"Alpha snippet"')?.(haystack)).toBe(true);
    expect(buildMatcher('"alpha snippet"')?.(haystack)).toBe(true);
  });

  it('supports NOT', () => {
    expect(buildMatcher('Zebra NOT Alpha')?.(haystack)).toBe(false);
    expect(buildMatcher('Zebra NOT missing')?.(haystack)).toBe(true);
  });

  it('supports OR', () => {
    expect(buildMatcher('missing OR Alpha')?.(haystack)).toBe(true);
  });

  it('supports wildcards', () => {
    expect(buildMatcher('Alp*')?.(haystack)).toBe(true);
    expect(buildMatcher('Zeb?a')?.(haystack)).toBe(true);
  });

  it('returns null for empty query', () => {
    expect(buildMatcher('')).toBeNull();
    expect(buildMatcher('   ')).toBeNull();
  });
});
