import { setsEqual } from '../setUtils';

describe('setsEqual', () => {
  it('should return true for two empty sets', () => {
    const set1 = new Set();
    const set2 = new Set();
    expect(setsEqual(set1, set2)).toBe(true);
  });

  it('should return true for two sets with the same elements', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([1, 2, 3]);
    expect(setsEqual(set1, set2)).toBe(true);
  });

  it('should return false for two sets with different elements', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([4, 5, 6]);
    expect(setsEqual(set1, set2)).toBe(false);
  });

  it('should return false for two sets where one is a subset of the other', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([1, 2]);
    expect(setsEqual(set1, set2)).toBe(false);
  });

  it('should accept arrays', () => {
    let array1 = [1, 2, 3];
    let array2 = [1, 2, 3];
    expect(setsEqual(array1, array2)).toBe(true);

    array2 = [4, 5, 6];
    expect(setsEqual(array1, array2)).toBe(false);

    let array = [1, 2, 3];
    let set = new Set([1, 2, 3]);
    expect(setsEqual(array, set)).toBe(true);
    expect(setsEqual(set, array)).toBe(true);

    set = new Set([4, 5, 6]);
    expect(setsEqual(array, set)).toBe(false);
    expect(setsEqual(set, array)).toBe(false);
  });
});
