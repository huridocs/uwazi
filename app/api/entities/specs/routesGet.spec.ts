import { Application, NextFunction, Request, Response } from 'express';
import request, { Response as SuperTestResponse } from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import db from '#api/utils/testing_db.js';

import routes from '#api/entities/routes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { UserRole } from '#shared/types/userSchema.js';
import fixtures, { permissions, unpublishedDocId } from './fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe.each([
  { title: 'GET /api/entities - V1', featureFlags: { v2GetEntity: false } },
  { title: 'GET /api/entities - V2', featureFlags: { v2GetEntity: true } },
])('$title', ({ featureFlags }) => {
  const authenticatedUser = {
    _id: db.id(),
    role: UserRole.COLLABORATOR,
    username: 'user 1',
    email: 'user@test.com',
  };

  let app: Application;
  let appWithoutUser: Application;

  beforeAll(() => {
    testingTenants.mockCurrentTenant({
      name: 'default',
      featureFlags,
    });
  });

  beforeEach(async () => {
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = authenticatedUser;
      next();
    });

    appWithoutUser = setUpApp(routes);

    // @ts-ignore
    await testingEnvironment.setUp(fixtures);

    testingTenants.changeCurrentTenant({ featureFlags });
  });

  describe('Basic entity retrieval', () => {
    it('should return entity by sharedId', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({
        rows: [
          {
            sharedId: 'shared',
            title: 'Penguin almost done',
          },
        ],
      });
    });

    it('should return entity by MongoDB _id', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared1', omitRelationships: true });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({
        rows: [
          {
            sharedId: 'shared1',
            title: expect.any(String),
          },
        ],
      });
    });

    it('should return 404 when entity does not exist', async () => {
      const response: SuperTestResponse = await request(appWithoutUser)
        .get('/api/entities')
        .query({ sharedId: 'nonexistent' });

      expect(response).toHaveStatus(404);
      expect(response.body).toMatchObject({ rows: [] });
    });
  });

  describe('Permissions inclusion', () => {
    it('should return entity with permissions when requested via include parameter', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'sharedPerm', include: JSON.stringify(['permissions']) });

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0]).toMatchObject({
        permissions,
      });
    });
  });

  describe('Published status filtering', () => {
    it('should not return unpublished entities to unauthenticated users', async () => {
      const response: SuperTestResponse = await request(appWithoutUser)
        .get('/api/entities')
        .query({ _id: unpublishedDocId.toString(), omitRelationships: true });

      expect(response).toHaveStatus(404);
      expect(response.body).toMatchObject({ rows: [] });
    });

    it('should return unpublished entities to authenticated users with permission', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'other', omitRelationships: true });

      expect(response).toHaveStatus(200);
    });
  });

  describe('Relationships', () => {
    describe('when omitRelationships=false (default)', () => {
      it('should include relationships for authenticated users', async () => {
        new UserInContextMockFactory().mock(authenticatedUser);
        const response: SuperTestResponse = await request(app)
          .get('/api/entities')
          .query({ sharedId: 'getWithRelRoot' });

        expect(response).toHaveStatus(200);
        expect(response.body.rows[0]).toMatchObject({
          relations: [
            expect.objectContaining({ entity: 'getWithRelRoot' }),
            expect.objectContaining({ entity: 'getWithRelPublic' }),
          ],
        });
      });

      it('should include relationships for unauthenticated users viewing published entities', async () => {
        const response: SuperTestResponse = await request(appWithoutUser)
          .get('/api/entities')
          .query({ sharedId: 'getWithRelRoot' });

        expect(response).toHaveStatus(200);
        expect(response.body.rows[0]).toMatchObject({
          relations: expect.any(Array),
        });
      });
    });

    describe('when omitRelationships=true', () => {
      it('should not include relationships field', async () => {
        new UserInContextMockFactory().mock(authenticatedUser);
        const response: SuperTestResponse = await request(app)
          .get('/api/entities')
          .query({ sharedId: 'shared', omitRelationships: true });

        expect(response).toHaveStatus(200);
        const entity = response.body.rows[0];
        expect(entity.relations).toBeUndefined();
        expect(entity.relationships).toBeUndefined();
      });
    });

    describe('filtering unpublished relationships for unauthenticated users', () => {
      it('should filter out unpublished entities from relations array', async () => {
        const response: SuperTestResponse = await request(appWithoutUser)
          .get('/api/entities')
          .query({ sharedId: 'getWithRelRoot' });

        expect(response).toHaveStatus(200);
        expect(response.body.rows[0]).toMatchObject({
          relations: expect.any(Array),
        });
      });

      it('should return relations property (not relationships)', async () => {
        const response: SuperTestResponse = await request(appWithoutUser)
          .get('/api/entities')
          .query({ sharedId: 'getWithRelRoot' });

        expect(response).toHaveStatus(200);
        const entity = response.body.rows[0];

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
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({
        rows: expect.any(Array),
      });
    });

    it('should limit results to 1 entity', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(response).toHaveStatus(200);
      expect(response.body.rows.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Language handling', () => {
    it('should return entity in default language (Spanish)', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0]).toMatchObject({
        language: 'es',
        title: 'Penguin almost done',
        sharedId: 'shared',
      });
    });

    it('should return English version when explicitly requested', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' })
        .set('Accept-Language', 'en');

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0]).toMatchObject({
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
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' })
        .set('Accept-Language', 'pt');

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0]).toMatchObject({
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
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', omitRelationships: true })
        .set('Accept-Language', 'en');

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0]).toMatchObject({
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
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', omitRelationships: true })
        .set('Accept-Language', 'en');

      expect(response).toHaveStatus(200);
      expect(response.body.rows[0].metadata.friends[0]).toMatchObject({
        value: expect.any(String),
        label: expect.any(String),
      });
    });
  });

  describe('Documents and Attachments', () => {
    it('should include documents array for entities with documents', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', omitRelationships: true });

      expect(response).toHaveStatus(200);

      const entity = response.body.rows[0];
      expect(entity).toMatchObject({
        documents: [
          { filename: expect.any(String), type: 'document', entity: 'shared' },
          { filename: expect.any(String), type: 'document', entity: 'shared' },
        ],
      });
    });

    it('should include attachments array for entities with attachments', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', omitRelationships: true });

      expect(response).toHaveStatus(200);

      const entity = response.body.rows[0];
      expect(entity).toMatchObject({
        attachments: [{ filename: expect.any(String), type: 'attachment', entity: 'shared' }],
      });
    });

    it('should include empty arrays when entity has no documents/attachments', async () => {
      new UserInContextMockFactory().mock(authenticatedUser);
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'getWithRelPublic', omitRelationships: true });

      expect(response).toHaveStatus(200);

      const entity = response.body.rows[0];
      expect(entity).toMatchObject({
        documents: [],
        attachments: [],
      });
    });
  });
});

// V2-only tests for metadata relationship permission filtering
describe('GET /api/entities - V2 - Metadata relationship permission filtering', () => {
  const collaboratorUser = {
    _id: db.id(),
    role: UserRole.COLLABORATOR,
    username: 'collaborator',
    email: 'collaborator@test.com',
  };

  const user1Id = db.id();

  let app: Application;
  let appWithoutUser: Application;
  let appWithCollaborator: Application;
  let appWithUser1: Application;

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

    // @ts-ignore
    await testingEnvironment.setUp(fixtures);
  });

  it('should filter out unpublished entities from metadata relationship properties for unauthenticated users', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'testEntityWithMixedRefs', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Should include published entity 'shared1' in friends
    expect(entity.metadata.friends).toEqual([
      expect.objectContaining({ value: 'shared1', label: expect.any(String) }),
    ]);

    // Should NOT include unpublished entity in relationships
    expect(entity.metadata.friends).not.toContainEqual(
      expect.objectContaining({ value: 'unpublishedForTest' })
    );
  });

  it('should include entities user has explicit permissions to, even if unpublished', async () => {
    const response: SuperTestResponse = await request(appWithUser1)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'entityPointingToOther', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // User has permission to 'other', should see it in metadata
    expect(entity.metadata.friends).toContainEqual(
      expect.objectContaining({
        value: 'other',
        label: expect.any(String),
      })
    );
  });

  it('should filter out entities user does not have permissions to access', async () => {
    const response: SuperTestResponse = await request(appWithCollaborator)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'entityWithRestrictedRef', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Should include accessible entity
    expect(entity.metadata.friends).toContainEqual(expect.objectContaining({ value: 'shared2' }));

    // Should NOT include restricted entity
    expect(entity.metadata.friends).not.toContainEqual(
      expect.objectContaining({ value: 'restrictedEntity' })
    );
  });

  it('should filter multiple relationship properties independently', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'shared', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Both properties should be filtered based on published status
    expect(entity.metadata.friends).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'shared2' })])
    );

    expect(entity.metadata.enemies).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'shared2' })])
    );
  });

  it('should return empty array when all referenced entities are inaccessible', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'entityWithOnlyRestrictedRefs', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Should have empty array, not undefined
    expect(entity.metadata.friends).toEqual([]);
  });

  it('should handle mixed accessible and inaccessible entities in same relationship array', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'entityWithMixedAccess', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Should only include accessible entities (published for unauthenticated)
    expect(entity.metadata.enemies.length).toBe(2); // Only 2 published entities
    expect(entity.metadata.enemies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'shared1', label: expect.any(String) }),
        expect.objectContaining({ value: 'shared2', label: expect.any(String) }),
      ])
    );

    // Should NOT include unpublished
    expect(entity.metadata.enemies).not.toContainEqual(
      expect.objectContaining({ value: 'unpublishedForTest' })
    );
  });

  it('should preserve inherited property data only for accessible entities', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'shared', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Accessible entity should have inherited property
    const accessibleEnemy = entity.metadata.enemies.find((e: any) => e.value === 'shared2');
    expect(accessibleEnemy).toBeDefined();
    // Enemy property has inherit config, should have inheritedValue
    if (accessibleEnemy.inheritedValue) {
      expect(accessibleEnemy.inheritedValue).toEqual(expect.any(Array));
    }
  });

  it('should not leak entity information through metadata for completely restricted entities', async () => {
    const response: SuperTestResponse = await request(appWithoutUser)
      .get('/api/entities')
      .set('Accept-Language', 'en')
      .query({ sharedId: 'entityReferencingUnpublished', omitRelationships: true });

    expect(response).toHaveStatus(200);

    const entity = response.body.rows[0];

    // Check that unpublished entity is not in the array at all
    const unpublishedRef = entity.metadata.friends.find(
      (f: any) => f.value === 'unpublishedForTest'
    );
    expect(unpublishedRef).toBeUndefined();

    // Should only have accessible entity
    expect(entity.metadata.friends).toEqual([
      expect.objectContaining({ value: 'shared2', label: 'shared2title' }),
    ]);

    // Verify no partial data leaked
    entity.metadata.friends.forEach((friend: any) => {
      // All visible friends should have complete data (not partial)
      if (friend.label) {
        expect(friend.label).not.toBe('Unpublished Test Entity');
      }
    });
  });
});

afterAll(async () => testingEnvironment.tearDown());
