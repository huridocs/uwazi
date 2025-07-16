import { sanitizeThesaurusLabel } from '../helpers';

describe('thesaurus helpers', () => {
  describe('sanitizeThesaurusLabel', () => {
    it('should handle null and undefined values', () => {
      expect(sanitizeThesaurusLabel(null as any)).toBe('');
      expect(sanitizeThesaurusLabel(undefined as any)).toBe('');
      expect(sanitizeThesaurusLabel('')).toBe('');
    });

    it('should replace newlines with spaces', () => {
      expect(sanitizeThesaurusLabel('hello\nworld')).toBe('hello world');
      expect(sanitizeThesaurusLabel('hello\r\nworld')).toBe('hello world');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(sanitizeThesaurusLabel('hello    world')).toBe('hello world');
      expect(sanitizeThesaurusLabel('hello   world   test')).toBe('hello world test');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(sanitizeThesaurusLabel('  hello world  ')).toBe('hello world');
    });

    it('should apply all sanitizations together', () => {
      expect(sanitizeThesaurusLabel('  hello\n   world  ')).toBe('hello world');
    });

    it('should preserve existing values without spaces', () => {
      expect(sanitizeThesaurusLabel('hello world')).toBe('hello world');
      expect(sanitizeThesaurusLabel('Hello World')).toBe('Hello World');
    });
  });
}); 