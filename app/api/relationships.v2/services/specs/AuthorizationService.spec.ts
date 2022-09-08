import { getConnection } from 'api/relationships.v2/database/getConnectionForCurrentTenant';
import { PermissionsDataSource } from 'api/relationships.v2/database/PermissionsDataSource';
import { User } from 'api/relationships.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AuthorizationService } from '../AuthorizationService';
import { UnauthorizedError } from '../UnauthorizedError';

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
      permissions: [{ refId: factory.id('user2'), level: 'write', type: 'user' }],
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
  it('should return false', async () => {
    const auth = new AuthorizationService(new PermissionsDataSource(getConnection()), undefined);
    expect(await auth.isAuthorized('read', ['entity1'])).toBe(false);
    expect(await auth.isAuthorized('write', ['entity1'])).toBe(false);
  });

  it('should throw an error', async () => {
    const auth = new AuthorizationService(new PermissionsDataSource(getConnection()), undefined);
    await expect(async () => auth.validateAccess('read', ['any entity'])).rejects.toThrow(
      UnauthorizedError
    );
    await expect(async () => auth.validateAccess('write', ['any other entity'])).rejects.toThrow(
      UnauthorizedError
    );
  });
});

describe("When there's an authenticated user", () => {
  describe.each(['admin', 'editor'] as const)('and the user is %s', role => {
    it('should return true', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role);
      const auth = new AuthorizationService(new PermissionsDataSource(getConnection()), adminUser);
      expect(await auth.isAuthorized('read', ['entity1'])).toBe(true);
      expect(await auth.isAuthorized('write', ['entity1'])).toBe(true);
    });

    it('should not throw an error', async () => {
      const adminUser = new User(factory.id('admin').toHexString(), role);
      const auth = new AuthorizationService(new PermissionsDataSource(getConnection()), adminUser);

      await auth.validateAccess('read', ['entity1']);
      await auth.validateAccess('write', ['entity1']);
    });
  });

  describe('and the user is collaborator', () => {
    type Case = { user: string; entities: string[]; level: 'read' | 'write'; result: boolean };
    it.each<Case>([
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
          new PermissionsDataSource(getConnection()),
          new User(factory.id(user).toHexString(), 'collaborator')
        );

        expect(await auth.isAuthorized(level, entities)).toBe(result);
      }
    );
  });
});
