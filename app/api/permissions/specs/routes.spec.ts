import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { permissionRoutes } from 'api/permissions/routes';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { contributors } from 'api/permissions/contributors';

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
        spyOn(entitiesPermissions, 'setEntitiesPermissions').and.returnValue(Promise.resolve([]));
      });
      it('should save the permissions ', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = {
          ids: ['shared1'],
          permissions: [{ _id: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(200);
        expect(entitiesPermissions.setEntitiesPermissions).toHaveBeenCalled();
      });

      it('should invalidate if body does not fit the expected schema', async () => {
        user = { username: 'user 1', role: 'admin' };
        const permissionsData = { entities: [], permissions: [{}] };
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
          permissions: [{ _id: 'user1', type: 'user', level: 'read' }],
        };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.unauthorized).toBe(true);
      });
    });

    describe('GET', () => {
      it('should get the permissions of requested entities', async () => {
        spyOn(entitiesPermissions, 'getEntitiesPermissions').and.returnValue(
          Promise.resolve([
            {
              _id: 'user1',
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
        expect(response.body).toEqual([{ _id: 'user1', level: 'read' }]);
      });
    });
  });

  describe('search for contributor to share with', () => {
    describe('GET', () => {
      beforeEach(() => {
        spyOn(contributors, 'getContributors').and.returnValue(
          Promise.resolve([{ _id: 'user1', type: 'user' }])
        );
      });

      it('should return the matched user and group list', async () => {
        const response = await request(app)
          .get('/api/contributors')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({ filterTerm: 'username' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ _id: 'user1', type: 'user' }]);
      });

      it('should not validate if no filterTerm is passed', async () => {
        const response = await request(app)
          .get('/api/contributors')
          .set('X-Requested-With', 'XMLHttpRequest')
          .query({});
        expect(response.status).toBe(400);
      });
    });
  });
});
