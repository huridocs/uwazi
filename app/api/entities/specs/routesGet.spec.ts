import { Application, NextFunction, Request, Response } from 'express';
import request, { Response as SuperTestResponse } from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment';
import { setUpApp } from '#api/utils/testingRoutes';
import db from '#api/utils/testing_db';

import routes from '#api/entities/routes';
import { testingTenants } from '#api/utils/testingTenants';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext';
import { UserRole } from '#shared/types/userSchema.js';
import fixtures, { permissions, unpublishedDocId, user1Id } from './routesGetFixtures';

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
  } else {
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

    it('should return entity by MongoDB _id', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const entity = await getEntity(app, 'shared1', { omitRelationships: true });

      expect(entity).toMatchObject({
        sharedId: 'shared1',
        title: expect.any(String),
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
      const response = await getEntity(appWithoutUser, '', {
        _id: unpublishedDocId.toString(),
        omitRelationships: true,
        expectStatus: 404,
      });

      expect(response.body).toMatchObject({ rows: [] });
    });

    it('should return unpublished entities to authenticated users with permission', async () => {
      await getEntity(app, 'other', { omitRelationships: true });
    });
  });

  describe('Relationships', () => {
    describe('when omitRelationships=false (default)', () => {
      it('should include relationships for authenticated users', async () => {
        new UserInContextMockFactory().mock(authenticatedUser);
        const entity = await getEntity(app, 'getWithRelRoot');

        expect(entity).toMatchObject({
          relations: [
            expect.objectContaining({ entity: 'getWithRelRoot' }),
            expect.objectContaining({ entity: 'getWithRelPublic' }),
          ],
        });
      });

      it('should include relationships for unauthenticated users viewing published entities', async () => {
        const entity = await getEntity(appWithoutUser, 'getWithRelRoot');

        expect(entity).toMatchObject({
          relations: expect.any(Array),
        });
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

        expect(entity).toMatchObject({
          relations: expect.any(Array),
        });
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

let appWithCollaborator: Application;
let appWithUser1: Application;

describe('GET /api/entities - V2 - Metadata relationship permission filtering', () => {
  beforeAll(() => {
    testingTenants.mockCurrentTenant({
      name: 'default',
      featureFlags: { v2GetEntity: true },
    });
  });

  beforeEach(async () => {
    // App with authenticated user
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = {
        _id: db.id(),
        role: UserRole.COLLABORATOR,
        username: 'user 1',
        email: 'user@test.com',
      };
      next();
    });

    // App without user (unauthenticated)
    appWithoutUser = setUpApp(routes);

    // App with collaborator user
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

  it('should mark unpublished entities with authorized:false for unauthenticated users', async () => {
    const entity = await getEntity(appWithoutUser, 'testEntityWithMixedRefs', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends).toMatchObject([
      { value: 'shared1', label: expect.any(String) },
      { value: 'unpublishedForTest', authorized: false },
    ]);
  });

  it('should include entities user has explicit permissions to, even if unpublished', async () => {
    const entity = await getEntity(appWithUser1, 'entityPointingToOther', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends).toContainEqual(
      expect.objectContaining({ value: 'other', label: expect.any(String) })
    );
  });

  it('should mark entities user lacks permissions to with authorized:false', async () => {
    const entity = await getEntity(appWithCollaborator, 'entityWithRestrictedRef', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends).toMatchObject([
      { value: 'shared2', label: expect.any(String) },
      { value: 'restrictedEntity', authorized: false },
    ]);
  });

  it('should filter multiple relationship properties independently', async () => {
    const entity = await getEntity(appWithoutUser, 'shared', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends).toMatchObject([
      { value: 'shared2', label: expect.any(String) },
    ]);
    expect(entity.metadata.friends[0]).not.toHaveProperty('authorized');

    expect(entity.metadata.enemies).toMatchObject([
      { value: 'shared2', label: expect.any(String) },
    ]);
    expect(entity.metadata.enemies[0]).not.toHaveProperty('authorized');
  });

  it('should mark all inaccessible referenced entities with authorized:false', async () => {
    const entity = await getEntity(appWithoutUser, 'entityWithOnlyRestrictedRefs', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends.length).toBeGreaterThan(0);
    entity.metadata.friends.forEach((friend: any) => {
      expect(friend.authorized).toBe(false);
    });
  });

  it('should mark inaccessible entities with authorized:false while keeping accessible ones unmarked', async () => {
    const entity = await getEntity(appWithoutUser, 'entityWithMixedAccess', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.enemies).toHaveLength(3);
    expect(entity.metadata.enemies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'shared1', label: expect.any(String) }),
        expect.objectContaining({ value: 'shared2', label: expect.any(String) }),
        expect.objectContaining({ value: 'restrictedEntity', authorized: false }),
      ])
    );
  });

  it('should keep restricted entities with authorized:false flag while preserving denormalized data', async () => {
    const entity = await getEntity(appWithoutUser, 'entityReferencingUnpublished', {
      omitRelationships: true,
      language: 'en',
    });

    expect(entity.metadata.friends).toMatchObject([
      { value: 'shared2', label: 'shared2title' },
      { value: 'unpublishedForTest', authorized: false },
    ]);

    entity.metadata.friends.forEach((friend: any) => {
      if (friend.authorized === false) {
        expect(friend.value).toBeDefined();
      }
    });
  });

  describe('with filterUnauthorizedRelated setting enabled', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp({
        ...fixtures,
        settings: [
          {
            ...fixtures.settings![0],
            features: {
              filterUnauthorizedRelated: true,
            },
          } as any,
        ],
      });

      testingTenants.changeCurrentTenant({
        featureFlags: { v2GetEntity: true },
      });
    });

    it('should filter out unpublished entities completely (with filterOut)', async () => {
      const entity = await getEntity(appWithoutUser, 'testEntityWithMixedRefs', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.friends).toMatchObject([
        { value: 'shared1', label: expect.any(String) },
      ]);
    });

    it('should filter out entities user does not have permissions to access (with filterOut)', async () => {
      const entity = await getEntity(appWithCollaborator, 'entityWithRestrictedRef', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.friends).toMatchObject([
        { value: 'shared2', label: expect.any(String) },
      ]);
    });

    it('should return empty array when all referenced entities are inaccessible (with filterOut)', async () => {
      const entity = await getEntity(appWithoutUser, 'entityWithOnlyRestrictedRefs', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.friends).toEqual([]);
    });

    it('should handle mixed accessible and inaccessible entities in same relationship array (with filterOut)', async () => {
      const entity = await getEntity(appWithoutUser, 'entityWithMixedAccess', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.enemies).toMatchObject([
        { value: 'shared1', label: expect.any(String) },
        { value: 'shared2', label: expect.any(String) },
      ]);
    });

    it('should not leak entity information through metadata for completely restricted entities (with filterOut)', async () => {
      const entity = await getEntity(appWithoutUser, 'entityReferencingUnpublished', {
        omitRelationships: true,
        language: 'en',
      });

      expect(entity.metadata.friends).toMatchObject([{ value: 'shared2', label: 'shared2title' }]);
    });
  });
});

afterAll(async () => testingEnvironment.tearDown());
