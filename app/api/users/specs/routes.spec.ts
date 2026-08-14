import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { UserRole } from '#shared/types/userSchema.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserSchema } from '#shared/types/userType.js';
import { userRoutes } from '#api/core/infrastructure/express/users/routes.js';
import users from '../users.js';

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

  describe('POST', () => {
    describe('/recoverpassword', () => {
      it.each([
        { value: undefined, keyword: 'required' },
        { value: 'a', keyword: 'minLength' },
      ])('should invalidate if the schema is not matched', async ({ value, keyword }) => {
        const response = await request(app).post('/api/recoverpassword').send({ email: value });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toEqual(keyword);
      });

      it('should call recoverPassword with the body email', async () => {
        jest.spyOn(users, 'recoverPassword').mockImplementation(async () => Promise.resolve());
        const response = await request(app)
          .post('/api/recoverpassword')
          .send({ email: 'recover@me.com' });
        expect(response.status).toBe(200);
        expect(users.recoverPassword).toHaveBeenCalledWith(
          'recover@me.com',
          expect.stringContaining('http://127.0.0.1')
        );
      });

      it('should return an error if recover password fails', async () => {
        class ErrorSample extends DomainError {}

        jest.spyOn(users, 'recoverPassword').mockImplementation(() => {
          throw new ErrorSample('error on recoverPassword', 'error_code');
        });
        const response = await request(app)
          .post('/api/recoverpassword')
          .send({ email: 'recover@me.com' });
        expect(response.status).toBe(400);
        expect(response.body.prettyMessage).toContain('error on recoverPassword');
      });
    });

    describe('/resetpassword', () => {
      it.each([
        { key: 'key', password: undefined, keyword: 'required' },
        { key: undefined, password: 'pass', keyword: 'required' },
      ])('should invalidate if the schema is not matched', async ({ key, password, keyword }) => {
        const response = await request(app).post('/api/resetpassword').send({ key, password });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toEqual(keyword);
      });

      it('should call users update with the body', async () => {
        //@ts-ignore
        jest.spyOn(users, 'resetPassword').mockImplementation(async () => Promise.resolve({}));
        const response = await request(app)
          .post('/api/resetpassword')
          .send({ key: 'key', password: 'pass' });
        expect(response.status).toBe(200);
        expect(users.resetPassword).toHaveBeenCalledWith({ key: 'key', password: 'pass' });
      });
    });
  });

  describe('GET', () => {
    it('should need authorization', async () => {
      jest.spyOn(users, 'get').mockImplementation(async () => Promise.resolve(['users']));
      currentUser = editorUser;
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    it('should call users get and filter out Public user', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'User1' },
        { _id: PUBLIC_USER_ID, username: 'PublicUser' },
        { _id: 'user2', username: 'User2' },
      ];
      jest.spyOn(users, 'get').mockImplementation(async () => Promise.resolve(mockUsers as any));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(users.get).toHaveBeenCalledWith({}, '+groups +failedLogins +accountLocked');
      expect(response.body).toHaveLength(2);
      expect(
        response.body.find((u: any) => u._id.toString() === PUBLIC_USER_ID.toString())
      ).toBeUndefined();
      expect(response.body).toEqual([
        { _id: 'user1', username: 'User1' },
        { _id: 'user2', username: 'User2' },
      ]);
    });
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
