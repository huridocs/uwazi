import { Application, NextFunction, Request, Response } from 'express';
import request, { Response as SuperTestResponse } from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment';
import { setUpApp } from '#api/utils/testingRoutes';
import db from '#api/utils/testing_db';

import routes from '#api/entities/routes';
import { testingTenants } from '#api/utils/testingTenants';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext';
import { UserRole } from '#shared/types/userSchema.js';
import fixtures, {
  permissions,
  user1Id,
  user2Id,
  user3Id,
  adminId,
  testGroup1Id,
  batmanFinishesId,
  docId1,
} from './routesGetFixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const authenticatedUser = {
  _id: db.id(),
  role: UserRole.COLLABORATOR,
  username: 'user 1',
  email: 'user@test.com',
};

const getEntity = async (
  appInstance: Application,
  sharedId: string,
  options: {
    omitRelationships?: boolean;
    include?: string[];
    language?: string;
    _id?: string;
    expectStatus?: number;
  } = {}
) => {
  const query: any = {};
  if (options._id) {
    query._id = options._id;
  }
  if (sharedId) {
    query.sharedId = sharedId;
  }
  if (options.omitRelationships !== undefined) query.omitRelationships = options.omitRelationships;
  if (options.include) query.include = JSON.stringify(options.include);

  const req = request(appInstance).get('/api/entities').query(query);
  if (options.language) req.set('Accept-Language', options.language);

  const response: SuperTestResponse = await req;

  if (options.expectStatus !== undefined) {
    expect(response).toHaveStatus(options.expectStatus);
    return response;
  }

  expect(response).toHaveStatus(200);
  return response.body.rows[0];
};

let app: Application;
let appWithoutUser: Application;

beforeAll(() => {
  testingTenants.mockCurrentTenant({
    name: 'default',
  });
});

describe.each([
  { title: 'GET /api/entities - V1', featureFlags: { v2GetEntity: false } },
  { title: 'GET /api/entities - V2', featureFlags: { v2GetEntity: true } },
])('$title', ({ featureFlags }) => {
  beforeEach(async () => {
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = authenticatedUser;
      next();
    });

    appWithoutUser = setUpApp(routes);

    await testingEnvironment.setUp(fixtures);

    testingTenants.changeCurrentTenant({ featureFlags });
  });

  describe('Basic entity retrieval', () => {
    it('should return entity by sharedId', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared');

      expect(entity).toMatchObject({
        sharedId: 'shared',
        title: 'Penguin almost done',
      });
    });

    it('should return 404 when entity does not exist', async () => {
      const response = await getEntity(appWithoutUser, 'nonexistent', { expectStatus: 404 });

      expect(response.body).toMatchObject({ rows: [] });
    });
  });

  describe('Permissions inclusion', () => {
    it('should return entity with permissions when requested via include parameter', async () => {
      const entity = await getEntity(app, 'sharedPerm', { include: ['permissions'] });

      expect(entity).toMatchObject({ permissions });
    });
  });

  describe('Published status filtering', () => {
    it('should not return unpublished entities to unauthenticated users', async () => {
      const response = await getEntity(appWithoutUser, 'other', {
        omitRelationships: true,
        expectStatus: 404,
      });

      expect(response.body).toMatchObject({ rows: [] });
    });

    it('should return unpublished entities to authenticated users with READ permission', async () => {
      // user1 has READ permission on 'other' entity
      const user1 = {
        _id: user1Id,
        role: UserRole.EDITOR,
        username: 'user1',
        email: 'user1@test.com',
      };
      const appWithUser1 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user1;
        next();
      });
      new UserInContextMockFactory().mock(user1);

      await getEntity(appWithUser1, 'other', { omitRelationships: true });
    });
  });

  describe('Security: Entity access control', () => {
    it('should allow admins to access any unpublished entity without explicit permissions', async () => {
      const adminUser = {
        _id: adminId,
        role: UserRole.ADMIN,
        username: 'admin',
        email: 'admin@test.com',
      };
      const appWithAdmin = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = adminUser;
        next();
      });
      new UserInContextMockFactory().mock(adminUser);

      // 'other' entity is unpublished, admin has NO explicit permission
      const entity = await getEntity(appWithAdmin, 'other', { omitRelationships: true });
      expect(entity).toBeDefined();
      expect(entity.sharedId).toBe('other');
      expect(entity.title).toContain('Unpublished entity'); // Language can be ES or EN
    });

    it('should allow editors to access any unpublished entity without explicit permissions', async () => {
      // Create an editor that is NOT in the permissions list for 'other'
      const editorUser = {
        _id: db.id(), // Random ID not in permissions
        role: UserRole.EDITOR,
        username: 'editor',
        email: 'editor@test.com',
      };
      const appWithEditor = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = editorUser;
        next();
      });
      new UserInContextMockFactory().mock(editorUser);

      // 'other' entity is unpublished, editor has NO explicit permission
      const entity = await getEntity(appWithEditor, 'other', { omitRelationships: true });
      expect(entity).toBeDefined();
      expect(entity.sharedId).toBe('other');
    });

    it('should deny collaborators access to unpublished entities without explicit permissions', async () => {
      const collaboratorUser = {
        _id: db.id(), // Random ID not in permissions
        role: UserRole.COLLABORATOR,
        username: 'collaborator',
        email: 'collaborator@test.com',
      };
      const appWithCollaborator = setUpApp(
        routes,
        (req: Request, _res: Response, next: NextFunction) => {
          (req as any).user = collaboratorUser;
          next();
        }
      );
      new UserInContextMockFactory().mock(collaboratorUser);

      const response = await getEntity(appWithCollaborator, 'other', {
        omitRelationships: true,
        expectStatus: 404,
      });
      expect(response.body).toMatchObject({ rows: [] });
    });

    it('should allow collaborators with WRITE permission to access unpublished entities', async () => {
      const user2 = {
        _id: user2Id,
        role: UserRole.COLLABORATOR,
        username: 'user2',
        email: 'user2@test.com',
      };
      const appWithUser2 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user2;
        next();
      });
      new UserInContextMockFactory().mock(user2);

      const entity = await getEntity(appWithUser2, 'other', { omitRelationships: true });
      expect(entity).toBeDefined();
      expect(entity.sharedId).toBe('other');
    });

    it('should allow collaborators with READ permission to access unpublished entities', async () => {
      const user1 = {
        _id: user1Id, // user1 has READ permission on 'other'
        role: UserRole.COLLABORATOR,
        username: 'user1',
        email: 'user1@test.com',
      };
      const appWithUser1 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user1;
        next();
      });
      new UserInContextMockFactory().mock(user1);

      const entity = await getEntity(appWithUser1, 'other', { omitRelationships: true });
      expect(entity).toBeDefined();
      expect(entity.sharedId).toBe('other');
    });

    it('should allow collaborators with group-based permissions to access unpublished entities', async () => {
      const user3 = {
        _id: user3Id,
        role: UserRole.COLLABORATOR,
        username: 'user3',
        email: 'user3@test.com',
        groups: [{ _id: testGroup1Id, name: 'testGroup1' }], // user3 is in testGroup1 which has WRITE on 'other'
      };
      const appWithUser3 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user3;
        next();
      });
      new UserInContextMockFactory().mock(user3);

      const entity = await getEntity(appWithUser3, 'other', { omitRelationships: true });
      expect(entity).toBeDefined();
      expect(entity.sharedId).toBe('other');
    });
  });

  describe('Security: Permissions field access control', () => {
    it('should not expose permissions field to unauthenticated users', async () => {
      // 'shared' is a published entity accessible to unauthenticated users
      const entity = await getEntity(appWithoutUser, 'shared', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeUndefined();
    });

    it('should always expose permissions field to admins', async () => {
      const adminUser = {
        _id: adminId,
        role: UserRole.ADMIN,
        username: 'admin',
        email: 'admin@test.com',
      };
      const appWithAdmin = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = adminUser;
        next();
      });
      new UserInContextMockFactory().mock(adminUser);

      const entity = await getEntity(appWithAdmin, 'other', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeDefined();
      expect(Array.isArray(entity.permissions)).toBe(true);
    });

    it('should always expose permissions field to editors', async () => {
      const editorUser = {
        _id: db.id(), // Random ID without explicit permissions
        role: UserRole.EDITOR,
        username: 'editor',
        email: 'editor@test.com',
      };
      const appWithEditor = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = editorUser;
        next();
      });
      new UserInContextMockFactory().mock(editorUser);

      const entity = await getEntity(appWithEditor, 'other', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeDefined();
      expect(Array.isArray(entity.permissions)).toBe(true);
    });

    it('should expose permissions field to collaborators with WRITE access', async () => {
      const user2 = {
        _id: user2Id, // user2 has WRITE permission on 'other'
        role: UserRole.COLLABORATOR,
        username: 'user2',
        email: 'user2@test.com',
      };
      const appWithUser2 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user2;
        next();
      });
      new UserInContextMockFactory().mock(user2);

      const entity = await getEntity(appWithUser2, 'other', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeDefined();
      expect(Array.isArray(entity.permissions)).toBe(true);
    });

    it('should expose permissions field to collaborators with WRITE access via group membership', async () => {
      const user3 = {
        _id: user3Id,
        role: UserRole.COLLABORATOR,
        username: 'user3',
        email: 'user3@test.com',
        groups: [{ _id: testGroup1Id, name: 'testGroup1' }], // testGroup1 has WRITE on 'other'
      };
      const appWithUser3 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user3;
        next();
      });
      new UserInContextMockFactory().mock(user3);

      const entity = await getEntity(appWithUser3, 'other', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeDefined();
      expect(Array.isArray(entity.permissions)).toBe(true);
    });

    it('should not expose permissions to users with only READ access', async () => {
      // user1 has READ on 'other', but is a COLLABORATOR (not privileged)
      const user1 = {
        _id: user1Id,
        role: UserRole.COLLABORATOR, // Changed from EDITOR to properly test non-privileged behavior
        username: 'user1',
        email: 'user1@test.com',
      };
      const appWithUser1 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user1;
        next();
      });
      new UserInContextMockFactory().mock(user1);

      const entity = await getEntity(appWithUser1, 'other', {
        include: ['permissions'],
        omitRelationships: true,
      });
      expect(entity.permissions).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    describe('when omitRelationships=false (default)', () => {
      it('should include relationships for authenticated users', async () => {
        new UserInContextMockFactory().mock(authenticatedUser);
        const entity = await getEntity(app, 'getWithRelRoot');

        const entityIds = entity.relations.map((r: any) => r.entity);
        expect(entityIds).toContain('getWithRelRoot');
        expect(entityIds).toContain('getWithRelPublic');
        expect(entityIds).not.toContain('getWithRelPrivate'); // collaborator has no permission
      });

      it('should include relationships for unauthenticated users viewing published entities', async () => {
        const entity = await getEntity(appWithoutUser, 'getWithRelRoot');

        expect(entity).toMatchObject({
          relations: expect.any(Array),
        });
      });

      it('should include unpublished relations for admin users', async () => {
        const adminUser = {
          _id: adminId,
          role: UserRole.ADMIN,
          username: 'admin',
          email: 'admin@test.com',
        };
        const appWithAdmin = setUpApp(
          routes,
          (req: Request, _res: Response, next: NextFunction) => {
            (req as any).user = adminUser;
            next();
          }
        );
        new UserInContextMockFactory().mock(adminUser);

        const entity = await getEntity(appWithAdmin, 'getWithRelRoot');

        const entityIds = entity.relations.map((r: any) => r.entity);
        expect(entityIds).toContain('getWithRelPublic');
        expect(entityIds).toContain('getWithRelPrivate');
      });

      it('should include unpublished relations for editor users', async () => {
        const editorUser = {
          _id: db.id(),
          role: UserRole.EDITOR,
          username: 'editor',
          email: 'editor@test.com',
        };
        const appWithEditor = setUpApp(
          routes,
          (req: Request, _res: Response, next: NextFunction) => {
            (req as any).user = editorUser;
            next();
          }
        );
        new UserInContextMockFactory().mock(editorUser);

        const entity = await getEntity(appWithEditor, 'getWithRelRoot');

        const entityIds = entity.relations.map((r: any) => r.entity);
        expect(entityIds).toContain('getWithRelPublic');
        expect(entityIds).toContain('getWithRelPrivate');
      });
    });

    describe('when omitRelationships=true', () => {
      it('should not include relationships field', async () => {
        new UserInContextMockFactory().mock(authenticatedUser);
        const entity = await getEntity(app, 'shared', { omitRelationships: true });

        expect(entity.relations).toBeUndefined();
        expect(entity.relationships).toBeUndefined();
      });
    });

    describe('filtering unpublished relationships for unauthenticated users', () => {
      it('should filter out unpublished entities from relations array', async () => {
        const entity = await getEntity(appWithoutUser, 'getWithRelRoot');

        const entityIds = entity.relations.map((r: any) => r.entity);
        expect(entityIds).toContain('getWithRelPublic');
        expect(entityIds).not.toContain('getWithRelPrivate');
      });

      it('should return relations property (not relationships)', async () => {
        const entity = await getEntity(appWithoutUser, 'getWithRelRoot');

        expect(entity).toMatchObject({
          relations: expect.any(Array),
        });
        expect(entity.relationships).toBeUndefined();
      });
    });
  });

  describe('Response format', () => {
    it('should return response with rows array', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response = await getEntity(app, 'shared', { expectStatus: 200 });

      expect(response.body).toMatchObject({
        rows: expect.any(Array),
      });
    });

    it('should limit results to 1 entity', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response = await getEntity(app, 'shared', { expectStatus: 200 });

      expect(response.body.rows.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Language handling', () => {
    it('should return entity in default language (Spanish)', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared');

      expect(entity).toMatchObject({
        language: 'es',
        title: 'Penguin almost done',
        sharedId: 'shared',
      });
    });

    it('should return English version when explicitly requested', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', { language: 'en' });

      expect(entity).toMatchObject({
        language: 'en',
        title: 'Batman finishes',
        sharedId: 'shared',
        metadata: {
          text: [{ value: 'textvalue' }],
        },
      });
    });

    it('should return Portuguese version when explicitly requested', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', { language: 'pt' });

      expect(entity).toMatchObject({
        language: 'pt',
        title: 'Penguin almost done',
        sharedId: 'shared',
        metadata: {
          text: [{ value: 'test' }],
        },
      });
    });
  });

  describe('Metadata with relationship properties', () => {
    it('should return entity with relationship metadata properties', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity).toMatchObject({
        metadata: {
          friends: [
            expect.objectContaining({
              value: expect.any(String),
              label: expect.any(String),
            }),
          ],
        },
      });
    });

    it('should include denormalized data in relationship properties', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.friends[0]).toMatchObject({
        value: expect.any(String),
        label: expect.any(String),
      });
    });
  });

  describe('Documents and Attachments', () => {
    it('should include documents array for entities with documents', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', { omitRelationships: true });

      expect(entity).toMatchObject({
        documents: [
          { filename: expect.any(String), type: 'document', entity: 'shared' },
          { filename: expect.any(String), type: 'document', entity: 'shared' },
        ],
      });
    });

    it('should include attachments array for entities with attachments', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared', { omitRelationships: true });

      expect(entity).toMatchObject({
        attachments: [{ filename: expect.any(String), type: 'attachment', entity: 'shared' }],
      });
    });

    it('should include empty arrays when entity has no documents/attachments', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'getWithRelPublic', { omitRelationships: true });

      expect(entity).toMatchObject({
        documents: [],
        attachments: [],
      });
    });
  });
});

const collaboratorUser = {
  _id: db.id(),
  role: UserRole.COLLABORATOR,
  username: 'collaborator',
  email: 'collaborator@test.com',
};

const adminUser = {
  _id: db.id(),
  role: UserRole.ADMIN,
  username: 'admin',
  email: 'admin@test.com',
};

const editorUser = {
  _id: db.id(),
  role: UserRole.EDITOR,
  username: 'editor',
  email: 'editor@test.com',
};

let appWithCollaborator: Application;
let appWithUser1: Application;
let appWithAdmin: Application;
let appWithEditor: Application;

describe('GET /api/entities - V2 - Metadata relationship permission filtering', () => {
  beforeAll(() => {
    testingTenants.mockCurrentTenant({
      name: 'default',
      featureFlags: { v2GetEntity: true },
    });
  });

  beforeEach(async () => {
    // App without user (unauthenticated)
    appWithoutUser = setUpApp(routes);

    // App with admin user
    appWithAdmin = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = adminUser;
      next();
    });

    // App with editor user
    appWithEditor = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = editorUser;
      next();
    });

    // App with collaborator user (no special permissions)
    appWithCollaborator = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = collaboratorUser;
      next();
    });

    // App with user1 who has permissions to specific entities
    appWithUser1 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = {
        _id: user1Id,
        role: UserRole.COLLABORATOR,
        username: 'user1',
        email: 'user1@test.com',
      };
      next();
    });

    await testingEnvironment.setUp(fixtures);

    testingTenants.changeCurrentTenant({ featureFlags: { v2GetEntity: true } });
  });

  describe('not logged in', () => {
    describe('default behavior (filterUnauthorized=false)', () => {
      it('should not have access to unpublished entities (authorized: false)', async () => {
        const entity = await getEntity(appWithoutUser, 'testEntityWithMixedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared1', label: expect.any(String) },
          { value: 'unpublishedForTest', authorized: false },
        ]);
      });
    });

    describe('with filterUnauthorized setting enabled', () => {
      beforeEach(async () => {
        // Recreate app
        appWithoutUser = setUpApp(routes);

        await testingEnvironment.setUp({
          ...fixtures,
          settings: [
            {
              ...fixtures.settings![0],
              filterUnauthorizedRelated: true,
            } as any,
          ],
        });

        testingTenants.changeCurrentTenant({
          featureFlags: { v2GetEntity: true },
        });
      });

      it('should have access to published entities only (no authorized flag, unpublished filtered out)', async () => {
        const entity = await getEntity(appWithoutUser, 'entityWithMixedAccess', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.enemies).toMatchObject([
          { value: 'shared1', label: expect.any(String) },
          { value: 'shared2', label: expect.any(String) },
        ]);
        expect(entity.metadata.enemies).toHaveLength(2);
        expect(entity.metadata.enemies.every((e: any) => !e.hasOwnProperty('authorized'))).toBe(
          true
        );
      });

      it('should return empty array when all entities are unpublished', async () => {
        const entity = await getEntity(appWithoutUser, 'entityWithOnlyRestrictedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toEqual([]);
      });
    });
  });

  describe('admin/editors', () => {
    describe('default behavior (filterUnauthorized=false)', () => {
      it.each([
        { getApp: () => appWithAdmin, role: 'admin' },
        { getApp: () => appWithEditor, role: 'editor' },
      ])('should have access to all entities including unpublished ($role)', async ({ getApp }) => {
        const entity = await getEntity(getApp(), 'testEntityWithMixedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared1', label: expect.any(String) },
          { value: 'unpublishedForTest', label: expect.any(String) },
        ]);
      });

      it.each([
        { getApp: () => appWithAdmin, role: 'admin' },
        { getApp: () => appWithEditor, role: 'editor' },
      ])('should not add authorized:false flag to any entities ($role)', async ({ getApp }) => {
        const entity = await getEntity(getApp(), 'entityWithRestrictedRef', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared2', label: expect.any(String) },
          { value: 'restrictedEntity', label: expect.any(String) },
        ]);
        entity.metadata.friends.forEach((friend: any) => {
          expect(friend).not.toHaveProperty('authorized');
        });
      });

      it('should access entities with explicit permissions without issues', async () => {
        const entity = await getEntity(appWithAdmin, 'entityWithOnlyRestrictedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toMatchObject([
          { value: 'restrictedEntity', label: expect.any(String) },
          { value: 'unpublishedForTest', label: expect.any(String) },
        ]);
        entity.metadata.friends.forEach((friend: any) => {
          expect(friend).not.toHaveProperty('authorized');
        });
      });
    });

    describe('with filterUnauthorized setting enabled', () => {
      beforeEach(async () => {
        // Recreate apps
        appWithAdmin = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
          (req as any).user = adminUser;
          next();
        });

        appWithEditor = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
          (req as any).user = editorUser;
          next();
        });

        await testingEnvironment.setUp({
          ...fixtures,
          settings: [
            {
              ...fixtures.settings![0],
              filterUnauthorizedRelated: true,
            } as any,
          ],
        });

        testingTenants.changeCurrentTenant({
          featureFlags: { v2GetEntity: true },
        });
      });

      it.each([
        { getApp: () => appWithAdmin, role: 'admin' },
        { getApp: () => appWithEditor, role: 'editor' },
      ])('should still have access to all entities ($role)', async ({ getApp }) => {
        const entity = await getEntity(getApp(), 'testEntityWithMixedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared1', label: expect.any(String) },
          { value: 'unpublishedForTest', label: expect.any(String) },
        ]);
      });

      it.each([
        { getApp: () => appWithAdmin, role: 'admin' },
        { getApp: () => appWithEditor, role: 'editor' },
      ])(
        'should not add authorized:false flag even with setting enabled ($role)',
        async ({ getApp }) => {
          const entity = await getEntity(getApp(), 'entityWithRestrictedRef', {
            omitRelationships: true,
            language: 'en',
          });

          expect(entity.metadata.friends).toMatchObject([
            { value: 'shared2', label: expect.any(String) },
            { value: 'restrictedEntity', label: expect.any(String) },
          ]);
          entity.metadata.friends.forEach((friend: any) => {
            expect(friend).not.toHaveProperty('authorized');
          });
        }
      );
    });
  });

  describe('collaborators', () => {
    describe('default behavior (filterUnauthorized=false)', () => {
      it('should have access to published entities (no authorized flag) (regardless of explicit permissions)', async () => {
        const entity = await getEntity(appWithCollaborator, 'entityWithRestrictedRef', {
          omitRelationships: true,
          language: 'en',
        });

        // shared2 is published but has no explicit permissions for collaboratorUser
        // It should still be accessible without the authorized:false flag
        const shared2Entity = entity.metadata.friends.find((f: any) => f.value === 'shared2');
        expect(shared2Entity).toBeDefined();
        expect(shared2Entity).not.toHaveProperty('authorized');
      });

      it('should not have access to unpublished entities without explicit permissions (authorized: false)', async () => {
        const entity = await getEntity(appWithCollaborator, 'entityWithRestrictedRef', {
          omitRelationships: true,
          language: 'en',
        });

        // restrictedEntity is unpublished and has no explicit permissions for collaboratorUser
        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared2', label: expect.any(String) },
          { value: 'restrictedEntity', authorized: false },
        ]);
      });

      it('should have access to unpublished entities with explicit permissions (no authorized flag)', async () => {
        const entity = await getEntity(appWithUser1, 'entityPointingToOther', {
          omitRelationships: true,
          language: 'en',
        });

        // 'other' is unpublished but user1 has explicit permissions
        expect(entity.metadata.friends).toContainEqual(
          expect.objectContaining({ value: 'other', label: expect.any(String) })
        );

        const otherEntity = entity.metadata.friends.find((f: any) => f.value === 'other');
        expect(otherEntity).not.toHaveProperty('authorized');
      });
    });

    describe('with filterUnauthorized setting enabled', () => {
      beforeEach(async () => {
        // Recreate apps
        appWithCollaborator = setUpApp(
          routes,
          (req: Request, _res: Response, next: NextFunction) => {
            (req as any).user = collaboratorUser;
            next();
          }
        );

        appWithUser1 = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
          (req as any).user = {
            _id: user1Id,
            role: UserRole.COLLABORATOR,
            username: 'user1',
            email: 'user1@test.com',
          };
          next();
        });

        await testingEnvironment.setUp({
          ...fixtures,
          settings: [
            {
              ...fixtures.settings![0],
              filterUnauthorizedRelated: true,
            } as any,
          ],
        });

        testingTenants.changeCurrentTenant({
          featureFlags: { v2GetEntity: true },
        });
      });

      it('should not have access to unpublished entities without explicit permissions (authorized: false)', async () => {
        const entity = await getEntity(appWithCollaborator, 'entityWithRestrictedRef', {
          omitRelationships: true,
          language: 'en',
        });

        // Even with filterUnauthorized=true, collaborators get entities marked (not filtered)
        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared2', label: expect.any(String) },
          { value: 'restrictedEntity', authorized: false },
        ]);
      });

      it('should have access to unpublished entities with explicit permissions (no authorized flag)', async () => {
        const entity = await getEntity(appWithUser1, 'entityPointingToOther', {
          omitRelationships: true,
          language: 'en',
        });

        expect(entity.metadata.friends).toContainEqual(
          expect.objectContaining({ value: 'other', label: expect.any(String) })
        );

        const otherEntity = entity.metadata.friends.find((f: any) => f.value === 'other');
        expect(otherEntity).not.toHaveProperty('authorized');
      });

      it('should not filter out inaccessible entities (unlike unauthenticated users)', async () => {
        const entity = await getEntity(appWithCollaborator, 'testEntityWithMixedRefs', {
          omitRelationships: true,
          language: 'en',
        });

        // Should keep both entities but mark the unpublished one
        expect(entity.metadata.friends).toMatchObject([
          { value: 'shared1', label: expect.any(String) },
          { value: 'unpublishedForTest', authorized: false },
        ]);
      });
    });
  });
});

describe('GET /api/entities - V2 _id compatibility', () => {
  beforeEach(async () => {
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = authenticatedUser;
      next();
    });

    appWithoutUser = setUpApp(routes);

    await testingEnvironment.setUp(fixtures);

    testingTenants.changeCurrentTenant({
      featureFlags: { v2GetEntity: true },
    });
  });

  it('should fetch entity by _id', async () => {
    new UserInContextMockFactory().mock(authenticatedUser);
    const entity = await getEntity(app, '', {
      _id: batmanFinishesId.toString(),
      omitRelationships: true,
    });

    expect(entity).toMatchObject({
      sharedId: 'shared',
      title: 'Batman finishes',
      language: 'en',
    });
  });

  it('should return 404 for non-existent _id', async () => {
    new UserInContextMockFactory().mock(authenticatedUser);
    const fakeId = db.id().toString();
    const response = await getEntity(app, '', {
      _id: fakeId,
      omitRelationships: true,
      expectStatus: 404,
    });

    expect(response.body).toMatchObject({ rows: [] });
  });

  it('should fetch entity with its own language when using _id', async () => {
    new UserInContextMockFactory().mock(authenticatedUser);
    // Request Spanish entity (_id: docId1) while in English language context
    const entity = await getEntity(app, '', {
      _id: docId1.toString(),
      omitRelationships: true,
      language: 'en', // Request in English context
    });

    // Should return Spanish entity (because _id is language-specific)
    expect(entity).toMatchObject({
      sharedId: 'shared',
      title: 'Penguin almost done',
      language: 'es', // Should be Spanish, not English
    });
  });

  it('should return 400 when neither _id nor sharedId provided', async () => {
    new UserInContextMockFactory().mock(authenticatedUser);
    const response = await getEntity(app, '', {
      omitRelationships: true,
      expectStatus: 400,
    });

    expect(response.body).toMatchObject({ error: 'sharedId or _id is required' });
  });

  it('should prefer sharedId when both _id and sharedId are provided', async () => {
    new UserInContextMockFactory().mock(authenticatedUser);
    const fakeId = db.id().toString();
    // Provide wrong _id but correct sharedId
    const entity = await getEntity(app, 'shared', {
      _id: fakeId, // Wrong _id
      omitRelationships: true,
      language: 'en',
    });

    // Should return entity matching sharedId (not the _id)
    expect(entity).toMatchObject({
      sharedId: 'shared',
      title: 'Batman finishes',
    });
  });
});

afterAll(async () => testingEnvironment.tearDown());
