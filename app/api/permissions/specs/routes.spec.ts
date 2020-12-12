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
  const app: Application = setUpApp(
    permissionRoutes,
    (_req: Request, _res: Response, next: NextFunction) => {
      next();
    }
  );

  describe('entities', () => {
    describe('POST', () => {
      it('should save the permissions ', async () => {
        spyOn(entitiesPermissions, 'setEntitiesPermissions').and.returnValue(Promise.resolve([]));
        const permissionsData = { entities: [], permissions: [{}] };
        const response = await request(app)
          .post('/api/entities/permissions')
          .set('X-Requested-With', 'XMLHttpRequest')
          .send(permissionsData);
        expect(response.status).toBe(200);
        expect(entitiesPermissions.setEntitiesPermissions).toHaveBeenCalled();
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
            id: JSON.stringify(['sharedId1', 'sharedId2']),
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
