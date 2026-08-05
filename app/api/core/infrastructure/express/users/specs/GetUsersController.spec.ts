import { ObjectId } from 'mongodb';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { userRoutes } from '../routes.js';
import { fixtures, f } from './fixtures.js';

jest.mock('../../../../../auth/encryptPassword.ts', () => ({
  encryptPassword: async () => Promise.resolve('hush hush super secret'),
}));

jest.mock('../../../../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const app: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: f.idString('admin'), role: 'admin', username: 'admin' };
    next();
  }
);

describe('GET /api/users (v2)', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ featureFlags: { v2UsersGet: true } });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  // eslint-disable-next-line max-statements
  it('should return active users without sensitive fields', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    expect(response.body[0]).toMatchObject({
      _id: expect.any(String),
      username: 'existinguser',
      role: 'editor',
      email: 'existing@test.com',
      groups: [{ _id: expect.any(String), name: 'Researchers' }],
    });
    expect(response.body[0]).not.toHaveProperty('password');
    expect(response.body[0]).not.toHaveProperty('deletedAt');

    expect(response.body[1]).toMatchObject({
      _id: expect.any(String),
      username: 'admin',
      role: 'admin',
      email: 'admin@test.com',
      groups: [],
    });
    expect(response.body[1]).not.toHaveProperty('password');
    expect(response.body[1]).not.toHaveProperty('deletedAt');

    const deletedUser = response.body.find((user: any) => user.username === 'deletedUser');
    expect(deletedUser).toBeUndefined();

    const publicUser = response.body.find((user: any) => user.username === 'public');
    expect(publicUser).toBeUndefined();
  });

  it('should include using2fa and accountLocked fields when present', async () => {
    await testingEnvironment.db.getCollection('users')!.insertOne({
      _id: new ObjectId(),
      username: 'lockeduser',
      role: 'editor',
      email: 'locked@test.com',
      using2fa: true,
      accountLocked: true,
    });

    const response = await request(app).get('/api/users');

    const lockedUser = response.body.find((u: any) => u.username === 'lockeduser');
    expect(lockedUser).toBeDefined();
    expect(lockedUser.using2fa).toBe(true);
    expect(lockedUser.accountLocked).toBe(true);
  });
});
