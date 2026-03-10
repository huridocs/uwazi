import { sanitizeText, sanitizeStringValue, sanitizeMetadataValue } from '../sanitizationUtils';

describe('sanitizationUtils', () => {
  describe('sanitizeText', () => {
    it('should handle null and undefined values', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
      expect(sanitizeText('')).toBe('');
    });

    it('should replace newlines with spaces', () => {
      expect(sanitizeText('hello\nworld')).toBe('hello world');
      expect(sanitizeText('hello\r\nworld')).toBe('hello world');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(sanitizeText('hello    world')).toBe('hello world');
      expect(sanitizeText('hello   world   test')).toBe('hello world test');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should apply all sanitizations together', () => {
      expect(sanitizeText('  hello\n   world  ')).toBe('hello world');
    });
  });

  describe('sanitizeStringValue', () => {
    it('should trim leading and trailing whitespace', () => {
      const result = sanitizeStringValue('  hello world  ', 'test');
      expect(result.value).toBe('hello world');
      expect(result.warnings).toEqual([
        {
          property: 'test',
          value: '  hello world  ',
          reason: 'Leading/trailing whitespace removed',
        },
        {
          property: 'test',
          value: '  hello world  ',
          reason: 'Multiple spaces normalized to single space',
        },
      ]);
    });

    it('should normalize multiple spaces to a single space', () => {
      const result = sanitizeStringValue('hello    world', 'test');
      expect(result.value).toBe('hello world');
      expect(result.warnings).toEqual([
        {
          property: 'test',
          value: 'hello    world',
          reason: 'Multiple spaces normalized to single space',
        },
      ]);
    });

    it('should normalize empty value patterns to empty string', () => {
      const patterns = [
        'null',
        'NULL',
        'Null',
        'undefined',
        'UNDEFINED',
        'Undefined',
        'N/A',
        'n/a',
        'N/a',
      ];
      patterns.forEach(pattern => {
        const result = sanitizeStringValue(pattern, 'test');
        expect(result.value).toBe('');
        expect(result.warnings).toEqual([
          {
            property: 'test',
            value: pattern,
            reason: 'Empty value pattern normalized to empty string',
          },
        ]);
      });
    });

    it('should apply all sanitizations in order', () => {
      const result = sanitizeStringValue('  null  ', 'test');
      expect(result.value).toBe('');
      expect(result.warnings).toEqual([
        {
          property: 'test',
          value: '  null  ',
          reason: 'Leading/trailing whitespace removed',
        },
        {
          property: 'test',
          value: '  null  ',
          reason: 'Multiple spaces normalized to single space',
        },
        {
          property: 'test',
          value: '  null  ',
          reason: 'Empty value pattern normalized to empty string',
        },
      ]);
    });
  });

  describe('sanitizeMetadataValue', () => {
    it('should handle null and undefined values', async () => {
      const nullResult = sanitizeMetadataValue(null, 'test', 'text');
      expect(nullResult.value).toBe('');
      await expect(nullResult.warnings[0].reason).toMatch(
        /Null\/undefined value converted to empty string/
      );

      const undefinedResult = sanitizeMetadataValue(undefined, 'test', 'text');
      expect(undefinedResult.value).toBe('');
      await expect(undefinedResult.warnings[0].reason).toMatch(
        /Null\/undefined value converted to empty string/
      );
    });

    it('should sanitize text-based types', () => {
      const result = sanitizeMetadataValue('  hello   world  ', 'test', 'text');
      expect(result.value).toBe('hello world');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should not sanitize non-text types', () => {
      const result = sanitizeMetadataValue('  123  ', 'test', 'numeric');
      expect(result.value).toBe('  123  ');
      expect(result.warnings).toEqual([]);
    });

    it('should handle empty string for text-based types', () => {
      const result = sanitizeMetadataValue('   ', 'test', 'text');
      expect(result.value).toBe('');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
