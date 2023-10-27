import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { UnauthorizedError } from 'api/authorization.v2/errors/UnauthorizedError';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { User, UserRole } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { AccessLevels, AuthorizationService } from '../AuthorizationService';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  relationTypes: [factory.relationType('relType1')],
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
      permissions: [{ refId: factory.id('group2'), level: 'write', type: 'group' }],
      published: true,
    }),
    factory.entity('entity4', undefined, undefined, {
      published: true,
    }),
    factory.entity('entity5', undefined, undefined, {
      permissions: [{ refId: factory.id('user1'), level: 'write', type: 'user' }],
    }),
  ],
  relationships: [
    factory.v2.database.relationshipDBO('rel12', 'entity1', 'entity2', 'relType1'),
    factory.v2.database.relationshipDBO('rel15', 'entity1', 'entity5', 'relType1'),
    factory.v2.database.relationshipDBO('rel23', 'entity2', 'entity3', 'relType1'),
    factory.v2.database.relationshipDBO('rel34', 'entity3', 'entity4', 'relType1'),
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
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity1'])).toBe(false);
      expect(await auth.isAuthorized('write', ['entity1'])).toBe(false);
    });

    it('should throw an error on validation', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
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
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity3'])).toBe(true);
      expect(await auth.isAuthorized('write', ['entity3'])).toBe(false);
    });
  });

  describe('and not all the entities are public', () => {
    it('should not allow to read nor write', async () => {
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        undefined
      );
      expect(await auth.isAuthorized('read', ['entity3', 'entity1'])).toBe(false);
      expect(await auth.isAuthorized('write', ['entity3', 'entity1'])).toBe(false);
    });
  });

  it('should allow empty read', async () => {
    const auth = new AuthorizationService(
      new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
      undefined
    );
    expect(await auth.isAuthorized('read', [])).toBe(true);
    expect(await auth.isAuthorized('write', [])).toBe(false);
  });
});

describe("When there's an authenticated user", () => {
  describe.each(['admin', 'editor'] as const)('and the user is %s', role => {
    it('should return true', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role, []);
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        adminUser
      );
      expect(await auth.isAuthorized('read', ['entity1'])).toBe(true);
      expect(await auth.isAuthorized('read', [])).toBe(true);
      expect(await auth.isAuthorized('write', ['entity1'])).toBe(true);
      expect(await auth.isAuthorized('write', [])).toBe(true);
    });

    it('should not throw an error', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role, []);
      const auth = new AuthorizationService(
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
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
      { user: 'user1', entities: ['entity3'], level: 'read', result: true },
      { user: 'user1', entities: ['entity3'], level: 'write', result: false },
      { user: 'user1', entities: ['entity1', 'entity3'], level: 'read', result: true },
      { user: 'user1', entities: ['entity1', 'entity3'], level: 'write', result: false },
      { user: 'user1', entities: ['entity2', 'entity3'], level: 'read', result: false },
      { user: 'user1', entities: ['entity2', 'entity3'], level: 'write', result: false },
      { user: 'user1', entities: [], level: 'read', result: true },
      { user: 'user1', entities: [], level: 'write', result: true },
    ])(
      'should return [$result] if [$user] wants to [$level] from/to $entities',
      async ({ user, entities, level, result }) => {
        const auth = new AuthorizationService(
          new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
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
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        new User(factory.id('grouped user').toHexString(), 'collaborator', [
          factory.id('group1').toHexString(),
          factory.id('group2').toHexString(),
        ])
      );

      expect(await auth.isAuthorized(level, entities)).toBe(result);
    });
  });
});

describe('filterEntities()', () => {
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
        new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
        user
      );

      const filtered = await auth.filterEntities(level, ['entity1', 'entity2', 'entity3']);

      expect(filtered).toEqual(expectedResult);
    }
  );
});

describe('filterRelationships()', () => {
  let allRelationships: Relationship[];

  beforeAll(async () => {
    const ds = new MongoRelationshipsDataSource(getConnection(), DefaultTransactionManager());
    allRelationships = await ds.getAll().all();
  });

  it.each<{
    case: string;
    user: User | undefined;
    level: AccessLevels;
    expectedIds: string[];
  }>([
    {
      case: 'unauthenticated user read',
      user: undefined,
      level: 'read',
      expectedIds: [factory.idString('rel34')],
    },
    {
      case: 'unauthenticated user write',
      user: undefined,
      level: 'write',
      expectedIds: [],
    },
    {
      case: 'collaborator read',
      user: new User(factory.idString('user1'), 'collaborator', []),
      level: 'read',
      expectedIds: [factory.idString('rel15'), factory.idString('rel34')],
    },
    {
      case: 'collaborator write',
      user: new User(factory.idString('user1'), 'collaborator', []),
      level: 'write',
      expectedIds: [factory.idString('rel15')],
    },
  ])('should filter for $case', async ({ user, level, expectedIds }) => {
    const auth = new AuthorizationService(
      new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
      user
    );

    const filtered = await auth.filterRelationships(allRelationships, level);
    const ids = filtered.map(r => r._id);

    expect(ids).toEqual(expectedIds);
  });

  it.each<{
    role: UserRole;
    level: AccessLevels;
  }>([
    { role: 'admin', level: 'read' },
    { role: 'admin', level: 'write' },
    { role: 'editor', level: 'read' },
    { role: 'editor', level: 'write' },
  ])('$role should be able to $level everything', async ({ role: username, level }) => {
    const user = new User(factory.idString(username), username, []);
    const auth = new AuthorizationService(
      new MongoPermissionsDataSource(getConnection(), DefaultTransactionManager()),
      user
    );

    const filtered = await auth.filterRelationships(allRelationships, level);

    expect(filtered).toHaveLength(allRelationships.length);
  });
});
