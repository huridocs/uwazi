import { shallowObjectDiff } from '../shallowObjectDiff';

const ABC = {
  A: 0,
  B: 1,
  C: 2,
};

describe('objectIndex()', () => {
  it('should handle empty objects', () => {
    expect(shallowObjectDiff({}, {})).toMatchObject({
      isDifferent: false,
      missing: [],
      extra: [],
      differentValue: [],
    });
    expect(shallowObjectDiff({}, ABC)).toMatchObject({
      isDifferent: true,
      missing: [],
      extra: ['A', 'B', 'C'],
      differentValue: [],
    });
    expect(shallowObjectDiff(ABC, {})).toMatchObject({
      isDifferent: true,
      missing: ['A', 'B', 'C'],
      extra: [],
      differentValue: [],
    });
  });

  it('should mark equality', () => {
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        B: 1,
        C: 2,
      })
    ).toMatchObject({
      isDifferent: false,
      missing: [],
      extra: [],
      differentValue: [],
    });
  });

  it('should find missing properties', () => {
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        C: 2,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: ['B'],
      extra: [],
      differentValue: [],
    });
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: ['B', 'C'],
      extra: [],
      differentValue: [],
    });
  });

  it('should find extra properties', () => {
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: [],
      extra: ['D'],
      differentValue: [],
    });
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
        E: 4,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: [],
      extra: ['D', 'E'],
      differentValue: [],
    });
  });

  it('should also return all concatenated', () => {
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        C: 999,
        D: 3,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: ['B'],
      extra: ['D'],
      differentValue: ['C'],
      all: ['B', 'D', 'C'],
    });
  });

  it('should find and mark deep difference', () => {
    expect(
      shallowObjectDiff(ABC, {
        A: 0,
        B: 9999,
        C: 2,
      })
    ).toMatchObject({
      isDifferent: true,
      missing: [],
      extra: [],
      differentValue: ['B'],
    });
    expect(
      shallowObjectDiff(
        {
          A: 0,
          nested: {
            samevalue: 0,
            differentvalue: 'text',
          },
        },
        {
          A: 0,
          nested: {
            samevalue: 0,
            differentvalue: 'other text',
          },
        }
      )
    ).toMatchObject({
      isDifferent: true,
      missing: [],
      extra: [],
      differentValue: ['nested'],
    });
  });
});
