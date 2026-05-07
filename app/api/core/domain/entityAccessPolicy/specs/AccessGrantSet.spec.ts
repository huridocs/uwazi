import { AccessGrantSet } from '../AccessGrantSet.js';
import { AccessLevel } from '../AccessLevel.js';
import { GrantType } from '../GrantType.js';

describe('AccessGrantSet', () => {
  it('creates an empty set', () => {
    const set = AccessGrantSet.empty();
    expect(set.size).toBe(0);
    expect(set.items).toEqual([]);
  });

  it('creates a set with valid grants', () => {
    const set = AccessGrantSet.create([
      { refId: 'u1', type: GrantType.User, level: AccessLevel.Read },
      { refId: 'g1', type: GrantType.Group, level: AccessLevel.Write },
    ]);
    expect(set.size).toBe(2);
  });

  it('throws DuplicateGrantError when two grants share the same refId', () => {
    expect(() =>
      AccessGrantSet.create([
        { refId: 'u1', type: GrantType.User, level: AccessLevel.Read },
        { refId: 'u1', type: GrantType.Group, level: AccessLevel.Write },
      ])
    ).toThrow('Access grants must be unique per refId');
  });

  it('returns a defensive copy of items', () => {
    const set = AccessGrantSet.create([
      { refId: 'u1', type: GrantType.User, level: AccessLevel.Write },
    ]);
    const items = set.items;
    items.pop(); // mutate the copy
    expect(set.size).toBe(1); // original unchanged
  });
});
