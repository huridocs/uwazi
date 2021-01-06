import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import userRoutes from 'api/users/routes';
import request from 'supertest';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import users from '../users.js';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('user routes', () => {
  let authenticatedUser: { username: string; role: string } | undefined;
  function getUser() {
    return authenticatedUser;
  }
  const app: Application = setUpApp(
    userRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  describe('validation', () => {
    it.each([
      { field: 'role', value: 'invalid', keyword: 'enum' },
      { field: 'role', value: undefined, keyword: 'required' },
      { field: 'username', value: undefined, keyword: 'required' },
      { field: 'username', value: '', keyword: 'minLength' },
      { field: 'email', value: undefined, keyword: 'required' },
      { field: 'email', value: '', keyword: 'minLength' },
    ])('should return a validation error if user data is not valid', async invalidData => {
      authenticatedUser = { username: 'user 1', role: UserRole.ADMIN };
      const newUser: UserSchema = {
        username: 'New User',
        role: UserRole.COLLABORATOR,
        email: 'new@mail.test',
      };
      // @ts-ignore
      newUser[invalidData.field] = invalidData.value;
      const response = await request(app)
        .post('/api/users/new')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.errors[0].keyword).toBe(invalidData.keyword);
      expect(response.body.error).toBe('validation failed');
    });

    it('should validate a valid user data', async () => {
      authenticatedUser = { username: 'user 1', role: UserRole.ADMIN };
      spyOn(users, 'newUser').and.returnValue(Promise.resolve());
      const newUser: UserSchema = {
        username: 'New User',
        role: UserRole.COLLABORATOR,
        email: 'new@mail.test',
      };
      const response = await request(app)
        .post('/api/users/new')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(newUser);
      expect(response.status).toBe(200);
    });
  });
});
