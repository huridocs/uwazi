import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { permissionRoutes } from 'api/permissions/routes';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { collaborators } from 'api/permissions/collaborators';
import { testingTenants } from 'api/utils/testingTenants';

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

  describe('entities', () => {
    describe('POST', () => {
      beforeEach(() => {
        spyOn(entitiesPermissions, 'set').and.returnValue(Promise.resolve([]));
      });
      it('should save the permissions ', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(200);
        expect(entitiesPermissions.set).toHaveBeenCalledWith(permissionsData);
      });

      it('should invalidate if body does not fit the expected schema', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = { entities: [], permissions: [{}] };
        testingTenants.mockCurrentTenant({ name: 'default' });
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(400);
      });

      it('should invalidate if permission level is mixed', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'mixed' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(400);
      });

      it('should not save if user is not authorized', async () => {
        user = undefined;
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.unauthorized).toBe(true);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        testingTenants.mockCurrentTenant({ name: 'default' });
      });
      it('should handle errors on POST', async () => {
        spyOn(entitiesPermissions, 'set').and.throwError('error on save');
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error: error on save');
      });
      it('should handle errors on GET', async () => {
        spyOn(entitiesPermissions, 'get').and.throwError('error on get');
        user = { username: 'user 1', role: 'admin' };
        const response = await request(app)
          .get('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({
            ids: JSON.stringify(['sharedId1', 'sharedId2']),
          });
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error: error on get');
      });
      it('should handle errors on collaborators search', async () => {
        spyOn(collaborators, 'search').and.throwError('error on get');
        user = { username: 'user 1', role: 'admin' };
        const response = await request(app)
          .get('/api/collaborators')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({ filterTerm: 'username' });
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error: error on get');
      });
    });

    describe('GET', () => {
      it('should get the permissions of requested entities', async () => {
        spyOn(entitiesPermissions, 'get').and.returnValue(
          Promise.resolve([
            {
              refId: 'user1',
              level: 'read',
            },
          ])
        );
        const response = await request(app)
          .get('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({
            ids: JSON.stringify(['sharedId1', 'sharedId2']),
          });
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ refId: 'user1', level: 'read' }]);
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
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({ filterTerm: 'username' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ refId: 'user1', type: 'user' }]);
      });

      it('should not validate if no filterTerm is passed', async () => {
        const response = await request(app)
          .get('/api/collaborators')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({});
        expect(response.status).toBe(400);
      });
    });
  });
});
