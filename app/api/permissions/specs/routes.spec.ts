import request from 'supertest';
import type { Application, NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { permissionRoutes } from '#api/permissions/routes.js';
import { collaborators } from '#api/permissions/collaborators.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { entitiesPermissions } from '../entitiesPermissions.js';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('permissions routes', () => {
  let user: { _id: string; username: string; role: string } | undefined;

  function getUser() {
    return user;
  }

  const app: Application = setUpApp(
    permissionRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  beforeAll(async () => {
    await testingEnvironment.setTenant();
    testingEnvironment.setRequestId();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('PUT', () => {
    it('should get the permissions by an array of entities ids', async () => {
      user = { _id: new ObjectId().toString(), username: 'user 1', role: 'admin' };
      jest.spyOn(entitiesPermissions, 'get').mockReturnValue(
        Promise.resolve([
          {
            refId: 'user1',
            level: 'read',
          } as MemberWithPermission,
        ])
      );
      const response = await request(app)
        .put('/api/entities/permissions')
        .send({ sharedIds: ['sharedId1', 'sharedId2'] });
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ refId: 'user1', level: 'read' }]);
    });

    it('should invalidate if data is not valid', async () => {
      user = { _id: new ObjectId().toString(), username: 'user 1', role: 'admin' };
      jest.spyOn(entitiesPermissions, 'get').mockReturnValue(
        Promise.resolve([
          {
            refId: 'user1',
            level: 'read',
          } as MemberWithPermission,
        ])
      );
      const response = await request(app)
        .put('/api/entities/permissions')
        .send(['sharedId1', 'sharedId2']);
      expect(response.status).toBe(400);
    });
  });

  describe('search for a collaborator to share with', () => {
    beforeEach(() => {
      jest
        .spyOn(collaborators, 'search')
        .mockResolvedValue([{ refId: 'user1', type: 'user' } as MemberWithPermission]);
    });

    it('should return the matched user and group list', async () => {
      const response = await request(app)
        .get('/api/collaborators')
        .query({ filterTerm: 'username' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ refId: 'user1', type: 'user' }]);
    });

    it('should not validate if no filterTerm is passed', async () => {
      const response = await request(app).get('/api/collaborators').query({});
      expect(response.status).toBe(400);
    });
  });
});
