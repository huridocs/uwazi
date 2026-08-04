import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
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

  describe('when the v2Auth2fa flag is off (legacy path)', () => {
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
  });

  describe('when the v2Auth2fa flag is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ featureFlags: { v2Auth2fa: true } });
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
  });
});
