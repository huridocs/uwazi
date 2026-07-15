import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { userRoutes } from '../routes.js';
import { fixtures, f } from './fixtures.js';
import { PUBLIC_USER_ID } from '#api/users/specs/fixtures.js';
import { UserRole } from '#api/core/domain/user/User.js';

jest.mock('../../../../../auth/encryptPassword.ts', () => ({
  encryptPassword: async () => Promise.resolve('hush hush super secret'),
}));

jest.mock('../../../../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const appWithAdminUser: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: f.idString('admin'), role: 'admin', username: 'admin' };
    next();
  }
);

const appWithEditorUser: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: f.idString('existinguser'), role: 'editor', username: 'existinguser' };
    next();
  }
);

describe('POST /api/users', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ featureFlags: { v2UpdateUser: true } });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    {
      case: 'email',
      body: {
        _id: f.idString('existinguser'),
        username: 'existinguser',
        role: 'editor',
        email: 'updated@test.com',
      },
      expected: { email: 'updated@test.com', role: 'editor' },
    },
    {
      case: 'username',
      body: {
        _id: f.idString('existinguser'),
        username: 'updateduser',
        role: 'editor',
        email: 'existing@test.com',
      },
      expected: { username: 'updateduser', role: 'editor' },
    },
    {
      case: 'role',
      body: {
        _id: f.idString('existinguser'),
        username: 'existinguser',
        role: 'collaborator',
        email: 'existing@test.com',
      },
      expected: { email: 'existing@test.com', role: 'collaborator' },
    },
  ])('should allow admin to update $case and return 201', async ({ body, expected }) => {
    const response = await request(appWithAdminUser).post('/api/users').send(body);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      _id: f.idString('existinguser'),
      username: 'existinguser',
      ...expected,
    });
  });

  it('should allow a user to update itself', async () => {
    const response = await request(appWithEditorUser)
      .post('/api/users')
      .send({
        _id: f.idString('existinguser'),
        username: 'existinguser',
        role: 'editor',
        email: 'updated@test.com',
        password: 'newpass',
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      _id: f.idString('existinguser'),
      username: 'existinguser',
      role: 'editor',
      email: 'updated@test.com',
    });

    const updatedUser = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: f.id('existinguser') });
    expect(updatedUser!.password).toBe('hush hush super secret');
  });

  it.each([
    { case: 'username', username: 'admin', email: 'existing@test.com' },
    { case: 'email', username: 'existinguser', email: 'admin@test.com' },
  ])('should fail if the $case exists', async ({ username, email }) => {
    const response = await request(appWithAdminUser)
      .post('/api/users')
      .send({
        _id: f.idString('existinguser'),
        role: 'editor',
        username,
        email,
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 when non-admin tries to edit another user', async () => {
    const response = await request(appWithEditorUser)
      .post('/api/users')
      .send({
        _id: f.idString('admin'),
        username: 'admin',
        role: 'admin',
        email: 'admin@test.com',
      });
    expect(response.status).toBe(401);
  });

  it('should return 401 when non-admin tries to change a role', async () => {
    const response = await request(appWithEditorUser)
      .post('/api/users')
      .send({
        _id: f.idString('admin'),
        username: 'admin',
        role: 'editor',
        email: 'admin@test.com',
      });
    expect(response.status).toBe(401);
  });

  it.each([
    { role: UserRole.ADMIN, username: 'admin', email: 'admin@test.com' },
    { role: UserRole.EDITOR, username: 'existinguser', email: 'admin@test.com' },
  ])(
    'should not allow a user with the $role role to change its own role',
    async ({ username, role, email }) => {
      const app: Application = setUpApp(
        userRoutes,
        (req: Request, _res: Response, next: NextFunction) => {
          req.user = { _id: f.idString(username), role, username };
          next();
        }
      );

      const response = await request(app)
        .post('/api/users')
        .send({
          _id: f.idString(username),
          username,
          email,
          role: 'collaborator',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot change own role');
    }
  );

  it('should not allow modifiying the system user', async () => {
    const response = await request(appWithAdminUser).post('/api/users').send({
      _id: PUBLIC_USER_ID,
      username: 'public',
      role: 'admin',
      email: 'public@uwazi.local',
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot modify system user');
  });
});
