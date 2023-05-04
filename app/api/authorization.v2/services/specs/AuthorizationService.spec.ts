import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { UnauthorizedError } from 'api/authorization.v2/errors/UnauthorizedError';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AccessLevels, AuthorizationService } from '../AuthorizationService';

const factory = getFixturesFactory();

const fixtures = {
  entities: [
    factory.entity('entity1', undefined, undefined, {
      permissions: [
        { refId: factory.id('user1'), level: 'write', type: 'user' },
        { refId: factory.id('user2'), level: 'read', type: 'user' },
      ],
    }),
    factory.entity('entity2', undefined, undefined, {
      permissions: [
        { refId: factory.id('user2'), level: 'write', type: 'user' },
        { refId: factory.id('group1'), level: 'read', type: 'group' },
      ],
    }),
    factory.entity('entity3', undefined, undefined, {
      permissions: [
        // @ts-ignore
        { refId: 'public', level: 'public', type: 'public' },
        { refId: factory.id('group2'), level: 'write', type: 'group' },
      ],
    }),
  ],
};

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe("When there's no authenticated user", () => {
  describe('and the entity is not public', () => {
    it('should return false', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity1'])).toBe(false);
      expect(await auth.isAuthorized('write', ['entity1'])).toBe(false);
    });

    it('should throw an error', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        undefined
      );
      await expect(async () => auth.validateAccess('read', ['entity1'])).rejects.toThrow(
        UnauthorizedError
      );
      await expect(async () => auth.validateAccess('write', ['entity2'])).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('and the entity is public', () => {
    it('should only allow to read', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity3'])).toBe(true);
      expect(await auth.isAuthorized('write', ['entity3'])).toBe(false);
    });
  });

  describe('and not all the entities are public', () => {
    it('should not allow to read nor write', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity3', 'entity1'])).toBe(false);
      expect(await auth.isAuthorized('write', ['entity3', 'entity1'])).toBe(false);
    });
  });
});

describe("When there's an authenticated user", () => {
  describe.each(['admin', 'editor'] as const)('and the user is %s', role => {
    it('should return true', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role, []);
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        adminUser
      );
      expect(await auth.isAuthorized('read', ['entity1'])).toBe(true);
      expect(await auth.isAuthorized('write', ['entity1'])).toBe(true);
    });

    it('should not throw an error', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role, []);
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        adminUser
      );

      await auth.validateAccess('read', ['entity1']);
      await auth.validateAccess('write', ['entity1']);
    });
  });

  describe('and the user is collaborator', () => {
    type Case1 = { user: string; entities: string[]; level: 'read' | 'write'; result: boolean };
    it.each<Case1>([
      { user: 'user1', entities: ['entity1'], level: 'write', result: true },
      { user: 'user1', entities: ['entity1'], level: 'read', result: true },
      { user: 'user1', entities: ['entity2'], level: 'read', result: false },
      { user: 'user2', entities: ['entity1'], level: 'write', result: false },
      { user: 'user2', entities: ['entity1'], level: 'read', result: true },
      { user: 'user1', entities: ['entity1', 'entity2'], level: 'write', result: false },
      { user: 'user1', entities: ['entity1', 'entity2'], level: 'read', result: false },
      { user: 'user2', entities: ['entity1', 'entity2'], level: 'write', result: false },
      { user: 'user2', entities: ['entity1', 'entity2'], level: 'read', result: true },
    ])(
      'should return [$result] if [$user] wants to [$level] from/to $entities',
      async ({ user, entities, level, result }) => {
        const auth = new AuthorizationService(
          new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
          new User(factory.id(user).toHexString(), 'collaborator', [])
        );

        expect(await auth.isAuthorized(level, entities)).toBe(result);
      }
    );

    type Case2 = { entities: string[]; level: 'read' | 'write'; result: boolean };
    it.each<Case2>([
      { entities: ['entity2', 'entity3'], level: 'read', result: true },
      { entities: ['entity3'], level: 'write', result: true },
    ])('should consider the user groups', async ({ entities, level, result }) => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        new User(factory.id('grouped user').toHexString(), 'collaborator', [
          factory.id('group1').toHexString(),
          factory.id('group2').toHexString(),
        ])
      );

      expect(await auth.isAuthorized(level, entities)).toBe(result);
    });
  });
});

describe('When filtering entities', () => {
  it.each<{
    user: User | undefined;
    usertype: string;
    level: AccessLevels;
    expectedResult: string[];
  }>([
    {
      user: new User(factory.id('user2').toHexString(), 'collaborator', []),
      usertype: 'collaborator',
      level: 'read',
      expectedResult: ['entity1', 'entity2', 'entity3'],
    },
    {
      user: new User(factory.id('user2').toHexString(), 'collaborator', []),
      usertype: 'collaborator',
      level: 'write',
      expectedResult: ['entity2'],
    },
    {
      user: new User(factory.id('user1').toHexString(), 'editor', []),
      usertype: 'editor',
      level: 'read',
      expectedResult: ['entity1', 'entity2', 'entity3'],
    },
    {
      user: new User(factory.id('user1').toHexString(), 'editor', []),
      usertype: 'editor',
      level: 'write',
      expectedResult: ['entity1', 'entity2', 'entity3'],
    },
    {
      user: new User(factory.id('user1').toHexString(), 'admin', []),
      usertype: 'admin',
      level: 'read',
      expectedResult: ['entity1', 'entity2', 'entity3'],
    },
    {
      user: new User(factory.id('user1').toHexString(), 'admin', []),
      usertype: 'admin',
      level: 'write',
      expectedResult: ['entity1', 'entity2', 'entity3'],
    },
    {
      user: undefined,
      usertype: 'undefined',
      level: 'read',
      expectedResult: ['entity3'],
    },
    {
      user: undefined,
      usertype: 'undefined',
      level: 'write',
      expectedResult: [],
    },
  ])(
    'should filter entities for a/an $usertype to $level',
    async ({ user, level, expectedResult }) => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), new MongoTransactionManager(getClient())),
        user
      );

      const filtered = await auth.filterEntities(level, ['entity1', 'entity2', 'entity3']);

      expect(filtered).toEqual(expectedResult);
    }
  );
});
