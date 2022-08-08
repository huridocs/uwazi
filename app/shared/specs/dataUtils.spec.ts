import { deepEquals } from '../dataUtils';

describe('deepEquals', () => {
  it('should handle null or undefined', () => {
    expect(deepEquals(null, 'data')).toBe(false);
    expect(deepEquals(null, null)).toBe(true);
    expect(deepEquals(undefined, 'data')).toBe(false);
    expect(deepEquals(undefined, undefined)).toBe(true);
    expect(deepEquals(undefined, null)).toBe(false);
  });

  it('should handle basic types', () => {
    expect(deepEquals(true, false)).toBe(false);
    expect(deepEquals(true, true)).toBe(true);
    expect(deepEquals(0, 1)).toBe(false);
    expect(deepEquals(0, 0)).toBe(true);
    expect(deepEquals('string', 'other string')).toBe(false);
    expect(deepEquals('string', 'string')).toBe(true);
  });

  it('should handle arrays', () => {
    expect(deepEquals([], [])).toBe(true);
    expect(deepEquals([0, 1], [])).toBe(false);
    expect(deepEquals([], [0, 1])).toBe(false);
    expect(deepEquals([0, 1, 2], [0, 1, 2])).toBe(true);
    expect(deepEquals([0, 1, 2], [0, 1])).toBe(false);
    expect(deepEquals([0, 1, 2], [0, 1, 'error'])).toBe(false);
    expect(deepEquals([0, 'error', 2], [0, 1, 2])).toBe(false);
    expect(deepEquals([0, 1, 2], null)).toBe(false);
  });

  it('should handle plain objects', () => {
    expect(deepEquals({}, {})).toBe(true);
    expect(deepEquals({ text: 'text', number: 1 }, {})).toBe(false);
    expect(deepEquals({}, { text: 'text', number: 1 })).toBe(false);
    expect(deepEquals({ text: 'text', number: 1 }, { number: 1, text: 'text' })).toBe(true);
    expect(deepEquals({ text: 'text', number: 1 }, { text: 'text' })).toBe(false);
    expect(deepEquals({ number: 1 }, { text: 'text', number: 1 })).toBe(false);
    expect(deepEquals({ text: 'text', number: 1 }, { number: 'error', text: 1 })).toBe(false);
    expect(deepEquals({ text: 'text', number: 0 }, { number: 'text', text: 1 })).toBe(false);
    expect(deepEquals({ text: 'text', number: 1 }, null)).toBe(false);
  });

  describe('for complex cases', () => {
    const base = {
      rootText: 'root text',
      rootNumber: 0,
      rootArray: [
        1,
        [11, [111, 222, 333], 33],
        {
          inArrayText: 'in array text',
          inArrayNumber: 1,
          inArrayArray: [],
        },
      ],
      rootObject: {
        inObjectText: 'in object text',
        inObjectNumber: 1,
        inObjectArray: [0, 1, 2, []],
      },
    };
    it('should find equality', () => {
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(true);
    });

    it('should find missing values', () => {
      expect(
        deepEquals(base, {
          rootText: 'root text',
          // rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222], 33], //missing 333
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              //inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            //inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, ['extra text']],
          },
        })
      ).toBe(false);
    });

    it('should find different values', () => {
      expect(
        deepEquals(base, {
          rootText: 'other text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            99999,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, undefined], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 99999,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: [0, 1, 2, []],
          },
        })
      ).toBe(false);
      expect(
        deepEquals(base, {
          rootText: 'root text',
          rootNumber: 0,
          rootArray: [
            1,
            [11, [111, 222, 333], 33],
            {
              inArrayText: 'in array text',
              inArrayNumber: 1,
              inArrayArray: [],
            },
          ],
          rootObject: {
            inObjectText: 'in object text',
            inObjectNumber: 1,
            inObjectArray: ['array with text instead of numbers'],
          },
        })
      ).toBe(false);
    });
  });
});
