import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { tenants } from '#api/tenants/tenantContext.js';
import {
  getConnection,
  getSharedConnection,
} from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
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
  let namespace: string;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      domain: 'uwazi',
      featureFlags: { v2UsersUtilityRoutes: true },
    });
    namespace = tenants.current().name;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a password recovery key and return 200 with OK', async () => {
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
  });

  it('should queue a SendPasswordRecoveryEmailHandler job with the recovery key', async () => {
    const recovery = await getConnection()
      .collection('passwordrecoveries')
      .findOne({ user: f.id('existinguser') });

    const job = await getSharedConnection()
      .collection('jobs')
      .findOne({ name: 'SendPasswordRecoveryEmailHandler', namespace });

    expect(job).toBeDefined();
    expect(job?.params).toMatchObject({
      userId: f.idString('existinguser'),
      domain: 'http://uwazi',
      key: recovery?.key,
    });
  });

  it('should return 200 with OK and create no recovery record or job for a non-existent email', async () => {
    const jobsBefore = await getSharedConnection()
      .collection('jobs')
      .countDocuments({ name: 'SendPasswordRecoveryEmailHandler', namespace });

    const response = await request(app)
      .post('/api/recoverpassword')
      .send({ email: 'nobody-here@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toBe('OK');

    const recoveries = await getConnection().collection('passwordrecoveries').find({}).toArray();
    expect(recoveries).toHaveLength(1);

    const jobsAfter = await getSharedConnection()
      .collection('jobs')
      .countDocuments({ name: 'SendPasswordRecoveryEmailHandler', namespace });
    expect(jobsAfter).toBe(jobsBefore);
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
