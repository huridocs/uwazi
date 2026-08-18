import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import auth2faRoutes from '../routes.js';
import fixtures, { secretedUserId } from './fixtures.js';

jest.mock('../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const app: Application = setUpApp(
  auth2faRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: 'adminId', role: UserRole.ADMIN, username: 'admin' };
    next();
  }
);

describe('POST /api/auth2fa-reset', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.db
      .getCollection('users')!
      .updateOne({ _id: secretedUserId }, { $set: { using2fa: true } });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should disable two-factor authentication and clear the secret for the target user', async () => {
    const response = await request(app)
      .post('/api/auth2fa-reset')
      .send({ _id: secretedUserId.toHexString() });

    expect(response.status).toBe(200);

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: secretedUserId });
    expect(user?.using2fa).toBe(false);
    expect(user?.secret).toBe(null);
  });

  it('should return 422 when _id is missing', async () => {
    const response = await request(app).post('/api/auth2fa-reset').send({});
    expect(response.status).toBe(422);
  });

  it('should return 422 when _id is not an ObjectId', async () => {
    const response = await request(app).post('/api/auth2fa-reset').send({ _id: 'not-an-objectid' });

    expect(response.status).toBe(422);

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: secretedUserId });
    expect(user?.using2fa).toBe(true);
  });

  it('should report success but change nothing for a soft-deleted user', async () => {
    await testingEnvironment.db
      .getCollection('users')!
      .updateOne({ _id: secretedUserId }, { $set: { deletedAt: new Date() } });

    const response = await request(app)
      .post('/api/auth2fa-reset')
      .send({ _id: secretedUserId.toHexString() });

    expect(response.status).toBe(200);

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: secretedUserId });
    expect(user?.using2fa).toBe(true);
    expect(user?.secret).toBe('correctSecret');
  });
});
