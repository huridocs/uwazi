import { EntityAccessPolicy } from '../EntityAccessPolicy.js';
import { AccessLevel } from '../AccessLevel.js';
import { GrantType } from '../GrantType.js';

describe('EntityAccessPolicy', () => {
  describe('createForNewEntity()', () => {
    it('creates a private policy with no grants when no creatorId provided (privileged actor)', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-1');
      expect(policy.sharedId).toBe('shared-1');
      expect(policy.grants).toEqual([]);
      expect(policy.isPublic).toBe(false);
    });

    it('creates a policy with a write grant for the creator (collaborator)', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-1', 'user-abc');
      expect(policy.grants).toHaveLength(1);
      expect(policy.grants[0]).toMatchObject({
        refId: 'user-abc',
        type: GrantType.User,
        level: AccessLevel.Write,
      });
      expect(policy.isPublic).toBe(false);
    });
  });

  describe('applyGrants()', () => {
    it('replaces the full grant set', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-3', 'old-user');
      policy.applyGrants([{ refId: 'new-user', type: GrantType.User, level: AccessLevel.Read }]);
      expect(policy.grants).toHaveLength(1);
      expect(policy.grants[0].refId).toBe('new-user');
    });

    it('throws DuplicateGrantError when new grants have duplicate refIds', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-3');
      expect(() =>
        policy.applyGrants([
          { refId: 'u1', type: GrantType.User, level: AccessLevel.Read },
          { refId: 'u1', type: GrantType.Group, level: AccessLevel.Write },
        ])
      ).toThrow('Access grants must be unique per refId');
    });

    it('accepts an empty grant array (removing all grants)', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-3', 'user-1');
      policy.applyGrants([]);
      expect(policy.grants).toHaveLength(0);
    });
  });

  describe('mergeGrants()', () => {
    it('updates the level for an existing refId, leaving others unchanged', () => {
      const policy = new EntityAccessPolicy({
        sharedId: 'shared-m',
        grants: [
          { refId: 'u1', type: GrantType.User, level: AccessLevel.Read },
          { refId: 'u2', type: GrantType.User, level: AccessLevel.Write },
        ],
        isPublic: false,
      });
      policy.mergeGrants([{ refId: 'u1', type: GrantType.User, level: AccessLevel.Write }]);
      expect(policy.grants).toHaveLength(2);
      expect(policy.grants.find(g => g.refId === 'u1')?.level).toBe(AccessLevel.Write);
      expect(policy.grants.find(g => g.refId === 'u2')?.level).toBe(AccessLevel.Write);
    });

    it('adds a new refId while preserving existing grants', () => {
      const policy = new EntityAccessPolicy({
        sharedId: 'shared-m',
        grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Read }],
        isPublic: false,
      });
      policy.mergeGrants([{ refId: 'u2', type: GrantType.Group, level: AccessLevel.Write }]);
      expect(policy.grants).toHaveLength(2);
      expect(policy.grants.find(g => g.refId === 'u1')).toBeDefined();
      expect(policy.grants.find(g => g.refId === 'u2')).toBeDefined();
    });

    it('leaves the policy unchanged when incoming list is empty', () => {
      const policy = new EntityAccessPolicy({
        sharedId: 'shared-m',
        grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Read }],
        isPublic: false,
      });
      policy.mergeGrants([]);
      expect(policy.grants).toHaveLength(1);
      expect(policy.grants[0].refId).toBe('u1');
    });
  });

  describe('setPublic()', () => {
    it('makes a policy public', () => {
      const policy = EntityAccessPolicy.createForNewEntity('shared-4');
      expect(policy.isPublic).toBe(false);
      policy.setPublic(true);
      expect(policy.isPublic).toBe(true);
    });

    it('makes a public policy private', () => {
      const policy = new EntityAccessPolicy({
        sharedId: 'shared-4',
        grants: [],
        isPublic: true,
      });
      policy.setPublic(false);
      expect(policy.isPublic).toBe(false);
    });
  });

  describe('access checks', () => {
    const policy = new EntityAccessPolicy({
      sharedId: 'shared-5',
      grants: [
        { refId: 'writer', type: GrantType.User, level: AccessLevel.Write },
        { refId: 'reader', type: GrantType.User, level: AccessLevel.Read },
        { refId: 'group-write', type: GrantType.Group, level: AccessLevel.Write },
      ],
      isPublic: false,
    });

    describe('allowsUserWrite()', () => {
      it('returns true for a user with a write grant', () => {
        expect(policy.allowsUserWrite('writer', [])).toBe(true);
      });

      it('returns true for a user in a group with a write grant', () => {
        expect(policy.allowsUserWrite('anyone', ['group-write'])).toBe(true);
      });

      it('returns false for a user with only a read grant', () => {
        expect(policy.allowsUserWrite('reader', [])).toBe(false);
      });

      it('returns false for an unknown user with no matching groups', () => {
        expect(policy.allowsUserWrite('unknown', ['other-group'])).toBe(false);
      });
    });

    describe('allowsUserRead()', () => {
      it('returns true for any user with any grant (read or write)', () => {
        expect(policy.allowsUserRead('reader', [])).toBe(true);
        expect(policy.allowsUserRead('writer', [])).toBe(true);
      });

      it('returns false for an unknown user on a private policy', () => {
        expect(policy.allowsUserRead('unknown', [])).toBe(false);
      });

      it('returns true for any user (even unknown) when policy is public', () => {
        const publicPolicy = new EntityAccessPolicy({
          sharedId: 'shared-6',
          grants: [],
          isPublic: true,
        });
        expect(publicPolicy.allowsUserRead('unknown', [])).toBe(true);
      });
    });

    describe('allowsPublicRead()', () => {
      it('returns false for a private policy', () => {
        expect(policy.allowsPublicRead()).toBe(false);
      });

      it('returns true for a public policy', () => {
        const pub = new EntityAccessPolicy({ sharedId: 's', grants: [], isPublic: true });
        expect(pub.allowsPublicRead()).toBe(true);
      });
    });
  });
});
