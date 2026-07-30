import * as otplib from 'otplib';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UserRole } from '#shared/types/userSchema.js';
import auth2faRoutes from '../routes.js';
import fixtures, { secretedUserId } from './fixtures.js';

const appFor = (currentUserId: string, username: string): Application =>
  setUpApp(auth2faRoutes, (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: currentUserId, role: UserRole.ADMIN, username };
    next();
  });

describe('POST /api/auth2fa-enable', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    jest
      .spyOn(otplib.authenticator, 'verify')
      .mockImplementation(({ token, secret }) => token === 'correctToken' && secret === 'correctSecret');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when the v2Auth2fa flag is off (legacy path)', () => {
    it('should enable two-factor authentication for the current user', async () => {
      const response = await request(appFor(secretedUserId.toHexString(), 'otheruser'))
        .post('/api/auth2fa-enable')
        .send({ token: 'correctToken' });

      expect(response.status).toBe(200);

      const user = await testingEnvironment.db
        .getCollection('users')!
        .findOne({ _id: secretedUserId });
      expect(user?.using2fa).toBe(true);
    });
  });

  describe('when the v2Auth2fa flag is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ featureFlags: { v2Auth2fa: true } });
    });

    it('should enable two-factor authentication for the current user', async () => {
      const response = await request(appFor(secretedUserId.toHexString(), 'otheruser'))
        .post('/api/auth2fa-enable')
        .send({ token: 'correctToken' });

      expect(response.status).toBe(200);

      const user = await testingEnvironment.db
        .getCollection('users')!
        .findOne({ _id: secretedUserId });
      expect(user?.using2fa).toBe(true);
    });

    it('should return 400 when the token is invalid', async () => {
      const response = await request(appFor(secretedUserId.toHexString(), 'otheruser'))
        .post('/api/auth2fa-enable')
        .send({ token: 'wrongToken' });

      expect(response.status).toBe(400);

      const user = await testingEnvironment.db
        .getCollection('users')!
        .findOne({ _id: secretedUserId });
      expect(user?.using2fa).toBeUndefined();
    });

    it('should return 422 when the token is missing', async () => {
      const response = await request(appFor(secretedUserId.toHexString(), 'otheruser'))
        .post('/api/auth2fa-enable')
        .send({});

      expect(response.status).toBe(422);
    });
  });
});
