import type { Application } from 'express';
import request from 'supertest';
import * as otplib from 'otplib';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { encryptPassword } from '#api/auth/encryptPassword.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import authRoutes from '#api/auth/routes.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

const f = getFixturesFactory();

const TWO_FACTOR_SECRET = otplib.authenticator.generateSecret();

let bcryptPassword: string;

const buildFixtures = async () => {
  bcryptPassword = await encryptPassword('validpassword');

  return {
    users: [
      f.user({ username: 'validuser', role: UserRole.EDITOR, password: bcryptPassword }),
      {
        ...f.user({ username: '2fauser', role: UserRole.EDITOR, password: bcryptPassword }),
        using2fa: true,
        secret: TWO_FACTOR_SECRET,
      },
    ],
    settings: [
      {
        site_name: 'Uwazi',
        languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }],
      },
    ],
  };
};

let app: Application;

describe('POST /api/login', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(await buildFixtures());
    app = setUpApp(authRoutes);
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(await buildFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when v2Login is off', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi', featureFlags: { v2Login: false } });
    });

    it('should log in through the legacy path', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'validuser', password: 'validpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('when v2Login is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi', featureFlags: { v2Login: true } });
    });

    it('should log in and establish a session', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'validuser', password: 'validpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 on a wrong password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'validuser', password: 'wrongpassword' });

      expect(response.status).toBe(400);
    });

    it('should return 409 when 2FA is enabled and no token is provided', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: '2fauser', password: 'validpassword' });

      expect(response.status).toBe(409);
    });

    it('should return 400 when the 2FA token is wrong', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: '2fauser', password: 'validpassword', token: '000000' });

      expect(response.status).toBe(400);
    });

    it('should log in when the 2FA token is correct', async () => {
      const token = otplib.authenticator.generate(TWO_FACTOR_SECRET);

      const response = await request(app)
        .post('/api/login')
        .send({ username: '2fauser', password: 'validpassword', token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });
});
