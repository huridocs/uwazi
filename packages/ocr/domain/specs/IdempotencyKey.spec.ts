import { IdempotencyKey } from '../IdempotencyKey.js';
import { InvalidIdempotencyKey } from '../errors/InvalidIdempotencyKey.js';

describe('IdempotencyKey', () => {
  it('should serialize as recordId:attempt', () => {
    expect(IdempotencyKey.of('rec1', 3).toString()).toBe('rec1:3');
  });

  it('should round-trip through parse()', () => {
    const key = IdempotencyKey.parse('rec1:3');

    expect(key.recordId).toBe('rec1');
    expect(key.attempt).toBe(3);
    expect(key.equals(IdempotencyKey.of('rec1', 3))).toBe(true);
  });

  it('should not equal a key for another attempt or record', () => {
    const key = IdempotencyKey.of('rec1', 3);

    expect(key.equals(IdempotencyKey.of('rec1', 2))).toBe(false);
    expect(key.equals(IdempotencyKey.of('rec2', 3))).toBe(false);
  });

  it('should accept attempt zero, the attempt of a record migrated while in flight', () => {
    expect(IdempotencyKey.parse('rec1:0').attempt).toBe(0);
    expect(IdempotencyKey.of('rec1', 0).toString()).toBe('rec1:0');
  });

  it.each([
    ['no separator', 'rec1'],
    ['an empty id', ':3'],
    ['a non numeric attempt', 'rec1:abc'],
    ['a negative attempt', 'rec1:-1'],
    ['a fractional attempt', 'rec1:1.5'],
    ['an empty string', ''],
  ])('should reject %s', (_case, raw) => {
    expect(() => IdempotencyKey.parse(raw)).toThrow(InvalidIdempotencyKey);
  });

  it.each([
    ['an empty id', '', 1],
    ['an id containing the separator', 're:c1', 1],
    ['a negative attempt', 'rec1', -1],
    ['a fractional attempt', 'rec1', 1.5],
  ])('should refuse to build a key with %s', (_case, id, attempt) => {
    expect(() => IdempotencyKey.of(id, attempt)).toThrow(InvalidIdempotencyKey);
  });
});
