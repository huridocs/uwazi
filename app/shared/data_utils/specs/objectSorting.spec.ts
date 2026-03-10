import { sortByStrings } from '../objectSorting';

describe('sortByStrings()', () => {
  it('should sort the objects by the given properties in place', () => {
    const objects = [
      { a: 'a', b: 'b' },
      { a: 'a', b: 'a' },
      { a: 'b', b: 'a' },
    ];
    const expected = [
      { a: 'a', b: 'a' },
      { a: 'a', b: 'b' },
      { a: 'b', b: 'a' },
    ];

    expect(sortByStrings(objects, [o => o.a, o => o.b])).toEqual(expected);
    expect(objects).toEqual(expected);
  });
});
