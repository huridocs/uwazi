import { titlePrefixSearch } from '../index.js';

describe('titlePrefixSearch', () => {
  it('matches the start of a title', () => {
    expect(titlePrefixSearch('MULTI')).toBe('title:(multi*)');
  });

  it('escapes query syntax', () => {
    expect(titlePrefixSearch('A+B')).toBe('title:(a\\+b*)');
  });

  it('skips a blank query', () => {
    expect(titlePrefixSearch('  ')).toBeUndefined();
  });
});
