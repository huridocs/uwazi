import { dateFromTimestamp, hasBound } from '../rangeTimestamp.js';

describe('rangeTimestamp', () => {
  it('keeps epoch and drops empty bounds', () => {
    expect(hasBound(0)).toBe(true);
    expect(hasBound(null)).toBe(false);
    expect(hasBound(undefined)).toBe(false);
    expect(dateFromTimestamp(0)).toEqual(new Date(0));
    expect(dateFromTimestamp(null)).toBeUndefined();
  });
});
