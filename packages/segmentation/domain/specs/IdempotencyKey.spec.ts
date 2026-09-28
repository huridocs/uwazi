import { IdempotencyKey } from '../IdempotencyKey.js';
import { InvalidIdempotencyKey } from '../errors/InvalidIdempotencyKey.js';

describe('IdempotencyKey', () => {
  it('should serialize as segmentationId:attempt', () => {
    expect(IdempotencyKey.of('seg1', 3).toString()).toBe('seg1:3');
  });

  it('should round-trip through parse()', () => {
    const key = IdempotencyKey.parse('seg1:3');

    expect(key.segmentationId).toBe('seg1');
    expect(key.attempt).toBe(3);
    expect(key.equals(IdempotencyKey.of('seg1', 3))).toBe(true);
  });

  it('should not equal a key for another attempt or segmentation', () => {
    const key = IdempotencyKey.of('seg1', 3);

    expect(key.equals(IdempotencyKey.of('seg1', 2))).toBe(false);
    expect(key.equals(IdempotencyKey.of('seg2', 3))).toBe(false);
  });

  it('should accept attempt zero, the attempt made before keys existed', () => {
    expect(IdempotencyKey.parse('seg1:0').attempt).toBe(0);
    expect(IdempotencyKey.of('seg1', 0).toString()).toBe('seg1:0');
  });

  it.each([
    ['no separator', 'seg1'],
    ['an empty id', ':3'],
    ['a non numeric attempt', 'seg1:abc'],
    ['a negative attempt', 'seg1:-1'],
    ['a fractional attempt', 'seg1:1.5'],
    ['an empty string', ''],
  ])('should reject %s', (_case, raw) => {
    expect(() => IdempotencyKey.parse(raw)).toThrow(InvalidIdempotencyKey);
  });

  it.each([
    ['an empty id', '', 1],
    ['an id containing the separator', 'se:g1', 1],
    ['a negative attempt', 'seg1', -1],
    ['a fractional attempt', 'seg1', 1.5],
  ])('should refuse to build a key with %s', (_case, id, attempt) => {
    expect(() => IdempotencyKey.of(id, attempt)).toThrow(InvalidIdempotencyKey);
  });
});
