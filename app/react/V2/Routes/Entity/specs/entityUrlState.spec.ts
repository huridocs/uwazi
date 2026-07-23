/**
 * @jest-environment jsdom
 */
import { parseEntityHash, serializeEntityHash } from '../entityUrlState.js';

describe('entityUrlState', () => {
  describe('parseEntityHash / serializeEntityHash', () => {
    it('parses and serializes hash params', () => {
      const parsed = parseEntityHash('#page=5&s=toc');
      expect(parsed.get('page')).toBe('5');
      expect(parsed.get('s')).toBe('toc');
      expect(serializeEntityHash(parsed)).toBe('#page=5&s=toc');
    });

    it('returns empty string for empty params', () => {
      expect(serializeEntityHash(new URLSearchParams())).toBe('');
    });
  });
});
