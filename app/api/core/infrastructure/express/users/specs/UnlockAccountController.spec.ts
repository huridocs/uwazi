import { ObjectId } from 'mongodb';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { userRoutes } from '../routes.js';
import { fixtures, f } from './fixtures.js';
import { UserRole } from '#shared/types/userSchema.js';

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

const lockedUserId = new ObjectId();

const unlockFixtures = {
  ...fixtures,
  users: [
    ...(fixtures.users || []),
    {
      _id: lockedUserId,
      username: 'lockeduser',
      role: UserRole.EDITOR,
      email: 'locked@test.com',
      password: 'hash',
      accountLocked: true,
      failedLogins: 5,
      accountUnlockCode: 'validcode',
    },
  ],
};

describe('POST /api/unlockaccount', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(unlockFixtures);
    testingTenants.changeCurrentTenant({
      featureFlags: { v2UsersUtilityRoutes: true },
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should unlock the account and return 200 with OK', async () => {
    const response = await request(app)
      .post('/api/unlockaccount')
      .send({ username: 'lockeduser', code: 'validcode' });

    expect(response.status).toBe(200);
    expect(response.body).toBe('OK');

    const user = await testingEnvironment.db.getCollection('users')!.findOne({ _id: lockedUserId });
    expect(user?.accountLocked).toBeUndefined();
    expect(user?.failedLogins).toBeUndefined();
    expect(user?.accountUnlockCode).toBeUndefined();
  });

  it('should return 400 for an invalid unlock code', async () => {
    const response = await request(app)
      .post('/api/unlockaccount')
      .send({ username: 'lockeduser', code: 'wrongcode' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid username or unlock code');
  });

  it('should return 400 for a non-existent username', async () => {
    const response = await request(app)
      .post('/api/unlockaccount')
      .send({ username: 'nobody', code: 'validcode' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid username or unlock code');
  });

  it('should return 422 when body is empty', async () => {
    const response = await request(app).post('/api/unlockaccount').send({});
    expect(response.status).toBe(422);
  });
});
