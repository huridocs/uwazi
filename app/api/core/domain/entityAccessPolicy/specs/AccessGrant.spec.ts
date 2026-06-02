import { AccessGrant } from '../AccessGrant.js';
import { AccessLevel } from '../AccessLevel.js';
import { GrantType } from '../GrantType.js';

describe('AccessGrant', () => {
  it('creates a valid grant', () => {
    const grant = new AccessGrant({
      refId: 'user-1',
      type: GrantType.User,
      level: AccessLevel.Read,
    });
    expect(grant.refId).toBe('user-1');
    expect(grant.type).toBe(GrantType.User);
    expect(grant.level).toBe(AccessLevel.Read);
  });

  it('throws ZodError when refId is empty', () => {
    expect(
      () => new AccessGrant({ refId: '', type: GrantType.User, level: AccessLevel.Read })
    ).toThrow();
  });

  it('throws ZodError when type is invalid', () => {
    expect(
      () => new AccessGrant({ refId: 'id', type: 'invalid' as any, level: AccessLevel.Read })
    ).toThrow();
  });

  it('does not accept "mixed" as a valid level (regression guard)', () => {
    expect(
      () => new AccessGrant({ refId: 'id', type: GrantType.User, level: 'mixed' as any })
    ).toThrow();
  });

  describe('equals()', () => {
    it('returns true for identical grants', () => {
      const a = new AccessGrant({ refId: 'u1', type: GrantType.User, level: AccessLevel.Write });
      const b = new AccessGrant({ refId: 'u1', type: GrantType.User, level: AccessLevel.Write });
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when level differs', () => {
      const a = new AccessGrant({ refId: 'u1', type: GrantType.User, level: AccessLevel.Read });
      const b = new AccessGrant({ refId: 'u1', type: GrantType.User, level: AccessLevel.Write });
      expect(a.equals(b)).toBe(false);
    });
  });
});
