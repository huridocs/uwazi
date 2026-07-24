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
const recoveryRecordId = new ObjectId();

const resetFixtures = {
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
      accountUnlockCode: 'unlock123',
    },
  ],
  passwordrecoveries: [
    {
      _id: recoveryRecordId,
      key: 'validkey',
      user: lockedUserId,
      expiresAt: new Date(Date.now() + 86400000),
    },
  ],
};

describe('POST /api/resetpassword', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(resetFixtures);
    testingTenants.changeCurrentTenant({
      featureFlags: { v2UsersUtilityRoutes: true },
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should reset the password and return 200 with OK', async () => {
    const response = await request(app)
      .post('/api/resetpassword')
      .send({ key: 'validkey', password: 'NewSecurePass123' });

    expect(response.status).toBe(200);
    expect(response.body).toBe('OK');

    const user = await testingEnvironment.db.getCollection('users')!.findOne({ _id: lockedUserId });
    expect(user?.accountLocked).toBeUndefined();
    expect(user?.failedLogins).toBeUndefined();
    expect(user?.accountUnlockCode).toBeUndefined();
    expect(user?.password).not.toBe('hash');

    const recovery = await testingEnvironment.db
      .getCollection('passwordrecoveries')!
      .findOne({ key: 'validkey' });
    expect(recovery).toBeNull();
  });

  it('should return 400 for an invalid recovery key', async () => {
    const response = await request(app)
      .post('/api/resetpassword')
      .send({ key: 'nonexistent', password: 'NewSecurePass123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Recovery key not found');
  });

  it('should return 422 when body is empty', async () => {
    const response = await request(app).post('/api/resetpassword').send({});
    expect(response.status).toBe(422);
  });
});
