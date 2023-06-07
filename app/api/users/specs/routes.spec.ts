import { setUpApp } from 'api/utils/testingRoutes';
import request from 'supertest';

import { errorLog } from 'api/log';
import { WithId } from 'api/odm/model.js';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { NextFunction, Request, Response } from 'express';
import { DeleteResult } from 'mongodb';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import userRoutes from '../routes.js';
import users from '../users.js';
import { User } from '../usersModel.js';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const invalidUserProperties = [
  { field: 'username', value: undefined, instancePath: '/body', keyword: 'required' },
  { field: 'email', value: undefined, instancePath: '/body', keyword: 'required' },
  { field: 'role', value: undefined, instancePath: '/body', keyword: 'required' },
  { field: 'username', value: '', instancePath: '/body/username', keyword: 'minLength' },
  { field: 'email', value: '', instancePath: '/body/email', keyword: 'minLength' },
  { field: 'role', value: 'INVALID', instancePath: '/body/role', keyword: 'enum' },
  { field: 'password', value: '', instancePath: '/body/password', keyword: 'minLength' },
];

describe('users routes', () => {
  let currentUser: UserSchema | undefined;

  const userToUpdate = {
    username: 'User 1',
    role: UserRole.EDITOR,
    email: 'user@test.com',
  };
  function getUser() {
    return currentUser;
  }
  const app = setUpApp(userRoutes, (req: Request, _res: Response, next: NextFunction) => {
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
    currentUser = {
      _id: 'admin1',
      username: 'Admin 1',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
  });

  describe('POST', () => {
    describe('/users', () => {
      beforeEach(() => {
        jest
          .spyOn(users, 'save')
          .mockImplementation(async () => Promise.resolve({} as WithId<User>));
      });

      it('should call users save with the body', async () => {
        await request(app).post('/api/users').send(userToUpdate);

        expect(users.save).toHaveBeenCalledWith(
          userToUpdate,
          currentUser,
          expect.stringContaining('http://127.0.0.1')
        );
      });

      describe('validation', () => {
        it.each(invalidUserProperties)(
          'should invalidate if there is an invalid property',
          async ({ field, value, instancePath, keyword }) => {
            // @ts-ignore
            const invalidUser = { ...userToUpdate, [field]: value };
            const response = await request(app).post('/api/users').send(invalidUser);
            expect(response.status).toBe(400);
            expect(response.body.errors[0].instancePath).toEqual(instancePath);
            expect(response.body.errors[0].keyword).toEqual(keyword);
          }
        );
      });
    });

    describe('/users/new', () => {
      it('should call users newUser with the body', async () => {
        jest
          .spyOn(users, 'newUser')
          .mockImplementation(async () => Promise.resolve({} as WithId<User>));
        const response = await request(app).post('/api/users/new').send(userToUpdate);

        expect(response.status).toBe(200);
        expect(users.newUser).toHaveBeenCalledWith(
          userToUpdate,
          expect.stringContaining('http://127.0.0.1')
        );
      });

      describe('validation', () => {
        it.each(invalidUserProperties)(
          'should invalidate if there is an invalid property',
          async ({ field, value, instancePath, keyword }) => {
            // @ts-ignore
            const invalidUser = { ...userToUpdate, [field]: value };
            const response = await request(app).post('/api/users/new').send(invalidUser);
            expect(response.status).toBe(400);
            expect(response.body.errors[0].instancePath).toEqual(instancePath);
            expect(response.body.errors[0].keyword).toEqual(keyword);
          }
        );
      });
    });

    describe('/recoverpassword', () => {
      let originalSilent: boolean | undefined;

      beforeAll(() => {
        originalSilent = errorLog.transports[1].silent;
        errorLog.transports[1].silent = true;
      });

      afterAll(() => {
        errorLog.transports[1].silent = originalSilent;
      });

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
        jest.spyOn(users, 'recoverPassword').mockImplementation(() => {
          throw new Error('error on recoverPassword');
        });
        const response = await request(app)
          .post('/api/recoverpassword')
          .send({ email: 'recover@me.com' });
        expect(response.status).toBe(500);
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

    describe('/unlockaccount', () => {
      it.each([
        { username: 'name', code: undefined, keyword: 'required' },
        { username: undefined, code: 'code', keyword: 'required' },
      ])('should invalidate if the schema is not matched', async ({ username, code, keyword }) => {
        const response = await request(app).post('/api/unlockaccount').send({ username, code });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toEqual(keyword);
      });
      it('should call users.unlockAccount with the body', async () => {
        jest
          .spyOn(users, 'unlockAccount')
          .mockImplementation(async () => Promise.resolve({} as WithId<User>));
        const response = await request(app)
          .post('/api/unlockAccount')
          .send({ username: 'user1', code: 'code' });
        expect(response.status).toBe(200);
        expect(users.unlockAccount).toHaveBeenCalledWith({ username: 'user1', code: 'code' });
      });
    });
  });

  describe('GET', () => {
    it('should need authorization', async () => {
      jest.spyOn(users, 'get').mockImplementation(async () => Promise.resolve(['users']));
      currentUser!.role = UserRole.EDITOR;
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });

    it('should call users get', async () => {
      jest.spyOn(users, 'get').mockImplementation(async () => Promise.resolve(['users']));
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(users.get).toHaveBeenCalledWith({}, '+groups +failedLogins +accountLocked');
      expect(response.body).toEqual(['users']);
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      jest
        .spyOn(users, 'delete')
        .mockImplementation(async () => Promise.resolve({} as DeleteResult));
    });

    it('should invalidate if the schema is not matched', async () => {
      const response = await request(app).delete('/api/users').query({ ids: undefined });
      expect(response.status).toBe(400);
      expect(response.body.errors[0].keyword).toEqual('required');
    });

    it('should need authorization', async () => {
      currentUser!.role = UserRole.EDITOR;
      const response = await request(app).delete('/api/users').query({ ids: 'user1' });
      expect(response.status).toBe(401);
    });

    it('should use users to delete it', async () => {
      const response = await request(app)
        .delete('/api/users')
        .query({ ids: ['userToDeleteId'] });
      expect(response.status).toBe(200);
      expect(users.delete).toHaveBeenCalledWith(['userToDeleteId'], currentUser);
    });
  });
});
