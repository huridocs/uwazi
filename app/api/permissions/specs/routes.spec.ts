import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { permissionRoutes } from 'api/permissions/routes';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';

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
  });
});
