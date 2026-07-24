import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import mailer from '#api/utils/mailer.js';
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

describe('POST /api/recoverpassword', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      domain: 'uwazi',
      featureFlags: { v2UsersUtilityRoutes: true },
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a password recovery key and return 200 with OK', async () => {
    jest.spyOn(mailer, 'send').mockResolvedValue({} as any);

    const response = await request(app)
      .post('/api/recoverpassword')
      .send({ email: 'existing@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toBe('OK');

    const recovery = await getConnection()
      .collection('passwordrecoveries')
      .findOne({ user: f.id('existinguser') });
    expect(recovery).toBeDefined();
    expect(recovery?.key).toBeDefined();
    expect(recovery?.key.length).toBeGreaterThan(0);

    jest.restoreAllMocks();
  });

  it('should return 422 when body is empty', async () => {
    const response = await request(app).post('/api/recoverpassword').send({});
    expect(response.status).toBe(422);
  });

  it('should return 422 for email shorter than 3 characters', async () => {
    const response = await request(app).post('/api/recoverpassword').send({ email: 'ab' });
    expect(response.status).toBe(422);
  });
});
