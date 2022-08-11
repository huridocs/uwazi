import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { permissionRoutes } from 'api/permissions/routes';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { collaborators } from 'api/permissions/collaborators';
import { errorLog } from 'api/log';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PUBLIC_PERMISSION } from '../publicPermission';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('permissions routes', () => {
  let user: { username: string; role: string } | undefined;

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

  describe('entities', () => {
    describe('POST', () => {
      beforeEach(() => {
        spyOn(entitiesPermissions, 'set').and.callFake(async () => Promise.resolve([]));
      });
      it('should save the permissions ', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [
            { refId: 'user1', type: 'user', level: 'read' },
            { ...PUBLIC_PERMISSION, level: 'read', label: undefined },
          ],
        };
        const response = await request(app).post('/api/entities/permissions').send(permissionsData);

        expect(response.status).toBe(200);
        expect(entitiesPermissions.set).toHaveBeenCalledWith(permissionsData);
      });

      it('should invalidate if body does not fit the expected schema', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = { entities: [], permissions: [{}] };
        const response = await request(app).post('/api/entities/permissions').send(permissionsData);
        expect(response.status).toBe(400);
      });

      it('should not save if user is not authorized', async () => {
        user = undefined;
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app).post('/api/entities/permissions').send(permissionsData);
        expect(response.unauthorized).toBe(true);
      });

      it.each(['admin', 'editor', 'collaborator'])('should authorized the role %s', async role => {
        user = { username: 'user 1', role };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app).post('/api/entities/permissions').send(permissionsData);
        expect(response.status).toBe(200);
      });
    });

    describe('Error Handling', () => {
      let originalSilent: boolean | undefined;

      beforeAll(() => {
        originalSilent = errorLog.transports[1].silent;
        errorLog.transports[1].silent = true;
      });

      afterAll(() => {
        errorLog.transports[1].silent = originalSilent;
      });

      it('should handle errors on POST', async () => {
        spyOn(entitiesPermissions, 'set').and.throwError('error on save');
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app).post('/api/entities/permissions').send(permissionsData);
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('error on save');
      });
      it('should handle errors on PUT', async () => {
        spyOn(entitiesPermissions, 'get').and.throwError('error on get');
        user = { username: 'user 1', role: 'admin' };
        const response = await request(app)
          .put('/api/entities/permissions')
          .send({ sharedIds: ['sharedId1', 'sharedId2'] });
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('error on get');
      });
      it('should handle errors on collaborators search', async () => {
        spyOn(collaborators, 'search').and.throwError('error on get');
        user = { username: 'user 1', role: 'admin' };
        const response = await request(app)
          .get('/api/collaborators')
          .query({ filterTerm: 'username' });
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('error on get');
      });
    });

    describe('PUT', () => {
      it('should get the permissions by an array of entities ids', async () => {
        user = { username: 'user 1', role: 'admin' };
        spyOn(entitiesPermissions, 'get').and.returnValue(
          Promise.resolve([
            {
              refId: 'user1',
              level: 'read',
            },
          ])
        );
        const response = await request(app)
          .put('/api/entities/permissions')
          .send({ sharedIds: ['sharedId1', 'sharedId2'] });
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ refId: 'user1', level: 'read' }]);
      });

      it('should invalidate if data is not valid', async () => {
        user = { username: 'user 1', role: 'admin' };
        spyOn(entitiesPermissions, 'get').and.returnValue(
          Promise.resolve([
            {
              refId: 'user1',
              level: 'read',
            },
          ])
        );
        const response = await request(app)
          .put('/api/entities/permissions')
          .send(['sharedId1', 'sharedId2']);
        expect(response.status).toBe(400);
      });
    });
  });

  describe('search for a collaborator to share with', () => {
    describe('GET', () => {
      beforeEach(() => {
        spyOn(collaborators, 'search').and.returnValue(
          Promise.resolve([{ refId: 'user1', type: 'user' }])
        );
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
});
