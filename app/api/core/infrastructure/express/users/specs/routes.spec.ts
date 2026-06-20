import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { userRoutes } from '../routes.js';
import { DispatcherAdapter } from '../../../jobs/DispatcherAdapter.js';
import { fixtures, existingUserId } from './fixtures.js';

jest.mock(
  '../../../../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock('../../../../../auth/encryptPassword.ts', () => ({
  encryptPassword: async () => Promise.resolve('hush hush super secret'),
}));

jest.mock('../../../../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const app: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: existingUserId.toHexString(), role: 'admin', username: 'admin' } as any;
    next();
  }
);

describe('POST /api/users/new', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    jest.spyOn(DispatcherAdapter.prototype, 'configureRecoveryPassword').mockResolvedValue();
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should create a user and return 201 with the created user withouth the password', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'newguy', role: 'editor', email: 'new@test.com', password: 'Secret123' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      username: 'newguy',
      role: 'editor',
      email: 'new@test.com',
    });
    expect(response.body.user.password).not.toBeDefined();

    const users = await testingEnvironment.db.getAllFrom('users');
    const createdUser = users.find(user => user.username === 'newguy');
    expect(createdUser).toMatchObject({
      username: 'newguy',
      role: 'editor',
      email: 'new@test.com',
    });
    expect(createdUser?.password).toBe('hush hush super secret');
  });

  it('should return 422 when body is empty', async () => {
    const response = await request(app).post('/api/users/new').send({});
    expect(response.status).toBe(422);
  });

  it('should return 422 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'test', role: 'editor', email: 'notanemail' });
    expect(response.status).toBe(422);
  });

  it('should return 422 for invalid role', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'test', role: 'superadmin', email: 'test@test.com' });
    expect(response.status).toBe(422);
  });

  it('should return 400 when username already exists', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'existinguser', role: 'editor', email: 'other@test.com' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('The username "existinguser" already exists');
  });

  it('should return 400 when email already exists', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'otheruser', role: 'editor', email: 'existing@test.com' });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('The email "existing@test.com" already exists');
  });

  it('should allow creating a user without a password', async () => {
    const response = await request(app)
      .post('/api/users/new')
      .send({ username: 'nopassword', role: 'admin', email: 'nopassword@test.com' });
    expect(response.status).toBe(201);
    const users = await testingEnvironment.db.getAllFrom('users');
    const createdUser = users.find(user => user.username === 'nopassword');
    expect(createdUser).toMatchObject({
      username: 'nopassword',
      role: 'admin',
      email: 'nopassword@test.com',
    });
  });
});
