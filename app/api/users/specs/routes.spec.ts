import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import { UserSchema } from '#shared/types/userType.js';
import { userRoutes } from '#api/core/infrastructure/express/users/routes.js';

const combinedRoutes = (app: any) => {
  userRoutes(app);
};

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock('../../auth', () => {
  const originalModule = jest.requireActual('../../auth');
  return {
    ...originalModule,
    validatePasswordMiddleWare: jest.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
  };
});

const adminUser = {
  _id: 'admin1',
  username: 'Admin 1',
  password: 'admin124',
  role: UserRole.ADMIN,
  email: 'admin@test.com',
};

const editorUser = {
  _id: 'editor1',
  username: 'Editor 1',
  role: UserRole.EDITOR,
  email: 'editor@test.com',
};

describe('users routes', () => {
  let currentUser: UserSchema | undefined;

  function getUser() {
    return currentUser;
  }
  const app = setUpApp(combinedRoutes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = getUser();
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setTenant();
    testingEnvironment.setRequestId();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    currentUser = adminUser;
  });

  describe('GET', () => {
    it('should need authorization', async () => {
      currentUser = editorUser;
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    // What the route returns is GetUsersController.spec.ts's job — it exercises the real
    // query service against fixtures, including the public-user and soft-delete exclusions.
  });

  describe('DELETE', () => {
    it('should need authorization', async () => {
      currentUser = editorUser;
      const response = await request(app)
        .delete('/api/users')
        .query({ ids: JSON.stringify(['user1']) });
      expect(response.status).toBe(401);
    });
  });
});
