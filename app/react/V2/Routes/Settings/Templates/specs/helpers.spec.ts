import { inheritMatches, optionalIdMatches, relationshipConfigMatches } from '../helpers.js';

describe('template property matching helpers', () => {
  describe('optionalIdMatches', () => {
    it('should treat null, undefined and empty string as equivalent', () => {
      expect(optionalIdMatches(null, undefined)).toBe(true);
      expect(optionalIdMatches('', null)).toBe(true);
      expect(optionalIdMatches(undefined, '')).toBe(true);
    });

    it('should compare non-empty ids strictly', () => {
      expect(optionalIdMatches('abc', 'abc')).toBe(true);
      expect(optionalIdMatches('abc', 'def')).toBe(false);
      expect(optionalIdMatches('abc', '')).toBe(false);
    });
  });

  describe('inheritMatches', () => {
    it('should treat empty inherit values as equivalent', () => {
      expect(inheritMatches(null, undefined)).toBe(true);
      expect(inheritMatches('', null)).toBe(true);
      expect(inheritMatches(undefined, '')).toBe(true);
    });

    it('should compare inherit objects by property and type', () => {
      const inherit = { property: 'prop1', type: 'text' };

      expect(inheritMatches(inherit, { ...inherit })).toBe(true);
      expect(inheritMatches(inherit, null)).toBe(false);
      expect(inheritMatches(inherit, { property: 'prop2', type: 'text' })).toBe(false);
    });
  });

  describe('relationshipConfigMatches', () => {
    it('should not flag a mismatch when only empty sentinels differ', () => {
      expect(
        relationshipConfigMatches(
          {
            content: '5bfbb1a0471dd0fc16ada146',
            relationType: '6a156ed77cdd1afa52f8cdb8',
            inherit: '',
          },
          {
            content: '5bfbb1a0471dd0fc16ada146',
            relationType: '6a156ed77cdd1afa52f8cdb8',
            inherit: null,
          }
        )
      ).toBe(true);
    });

    it('should flag a mismatch when relationship config differs', () => {
      expect(
        relationshipConfigMatches(
          { content: 'a', relationType: 'b', inherit: null },
          { content: 'a', relationType: 'c', inherit: null }
        )
      ).toBe(false);
    });
  });
});
