import { ObjectUtils } from '../Object.js';

describe('ObjectUtils', () => {
  describe('sanitizeUndefined()', () => {
    it('removes keys with undefined values', () => {
      const input = { a: 1, b: undefined, c: 'hello' };
      expect(ObjectUtils.sanitizeUndefined(input)).toEqual({ a: 1, c: 'hello' });
    });

    it('keeps keys with null values', () => {
      const input = { a: null, b: undefined };
      expect(ObjectUtils.sanitizeUndefined(input)).toEqual({ a: null });
    });

    it('keeps keys with falsy but defined values (0, false, empty string)', () => {
      const input = { zero: 0, flag: false, empty: '', undef: undefined };
      expect(ObjectUtils.sanitizeUndefined(input)).toEqual({ zero: 0, flag: false, empty: '' });
    });

    it('returns an empty object when all values are undefined', () => {
      expect(ObjectUtils.sanitizeUndefined({ a: undefined, b: undefined })).toEqual({});
    });

    it('returns a shallow copy when no values are undefined', () => {
      const input = { a: 1, b: 2 };
      const result = ObjectUtils.sanitizeUndefined(input);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(input);
    });

    it('does not mutate the original object', () => {
      const input: { a: number; b: undefined | number } = { a: 1, b: undefined };
      ObjectUtils.sanitizeUndefined(input);
      expect(Object.prototype.hasOwnProperty.call(input, 'b')).toBe(true);
      expect(input.b).toBeUndefined();
    });

    it('returns an empty object for an empty input', () => {
      expect(ObjectUtils.sanitizeUndefined({})).toEqual({});
    });
  });

  describe('sanitize()', () => {
    it('removes the specified keys', () => {
      const input = { a: 1, b: 2, c: 3 };
      expect(ObjectUtils.sanitize(input, ['a', 'c'])).toEqual({ b: 2 });
    });

    it('ignores keys that are not present on the object', () => {
      const input = { a: 1, b: 2 };
      expect(ObjectUtils.sanitize(input, ['c'] as any)).toEqual({ a: 1, b: 2 });
    });

    it('returns a full shallow copy when no keys are omitted', () => {
      const input = { a: 1, b: 2 };
      const result = ObjectUtils.sanitize(input, []);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(input);
    });

    it('returns an empty object when all keys are omitted', () => {
      const input = { a: 1, b: 2 };
      expect(ObjectUtils.sanitize(input, ['a', 'b'])).toEqual({});
    });

    it('does not mutate the original object', () => {
      const input = { a: 1, b: 2, c: 3 };
      ObjectUtils.sanitize(input, ['a']);
      expect(input).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('returns an empty object for an empty input', () => {
      expect(ObjectUtils.sanitize({}, [])).toEqual({});
    });

    it('preserves keys with undefined values', () => {
      const input = { a: 1, b: undefined as number | undefined, c: 3 };
      expect(ObjectUtils.sanitize(input, ['a'])).toEqual({ b: undefined, c: 3 });
    });
  });
});
