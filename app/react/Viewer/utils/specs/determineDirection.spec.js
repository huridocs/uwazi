import determineDirection from '../determineDirection';

describe('determineDirection (LTR or RTL)', () => {
  it('should return LTR for most cases', () => {
    expect(determineDirection({ language: 'eng' })).toBe('force-ltr');
    expect(determineDirection({})).toBe('force-ltr');
  });

  it('should return RTL for specific languages', () => {
    expect(determineDirection({ language: 'arb' })).toBe('force-rtl');
    expect(determineDirection({ language: 'fas' })).toBe('force-rtl');
  });
});
