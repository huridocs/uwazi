import request from 'supertest';
import type { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { permissionRoutes } from '#api/permissions/routes.js';
import { collaborators } from '#api/permissions/collaborators.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';

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

  describe('search for a collaborator to share with', () => {
    describe('GET', () => {
      beforeEach(() => {
        jest
          .spyOn(collaborators, 'search')
          .mockReturnValue(
            Promise.resolve([{ refId: 'user1', type: 'user' } as MemberWithPermission])
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
