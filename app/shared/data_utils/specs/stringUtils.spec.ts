import { compareStringLists, escapeEspecialChars } from '../stringUtils';

describe('compareStringLists()', () => {
  it('should throw an error on different length strings', () => {
    expect(() => {
      compareStringLists(['a'], ['a', 'b']);
    }).toThrowError('The lists must have the same length.');
  });

  it('should return 0 on equal lists', () => {
    expect(compareStringLists(['a'], ['a'])).toBe(0);
  });

  it.each([
    {
      list1: ['a'],
      list2: ['b'],
    },
    {
      list1: ['a', 'a'],
      list2: ['b', 'a'],
    },
    {
      list1: ['a', 'a'],
      list2: ['a', 'b'],
    },
    {
      list1: ['a', 'a', 'a'],
      list2: ['a', 'a', 'b'],
    },
    {
      list1: ['a', 'a', 'a'],
      list2: ['a', 'b', 'a'],
    },
  ])(
    'should compare lists based on alphabetical order as localeCompare does',
    ({ list1, list2 }) => {
      expect(compareStringLists(list1, list2)).toBe(-1);
      expect(compareStringLists(list2, list1)).toBe(1);
    }
  );
});

describe('escapeEspecialChars', () => {
  it('should escape especial characters', () => {
    const input = 'This / should? + { escape ^ any $ } (special chars) | \\';
    const output = escapeEspecialChars(input);
    expect(output).toEqual(
      'This \\/ should\\? \\+ \\{ escape \\^ any \\$ \\} \\(special chars\\) \\| \\\\'
    );
  });
});
