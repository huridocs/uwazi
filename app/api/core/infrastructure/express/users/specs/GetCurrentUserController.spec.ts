import type { Application } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { encryptPassword } from '#api/auth/encryptPassword.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import authRoutes from '#api/auth/routes.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

const f = getFixturesFactory();

let bcryptPassword: string;

const buildFixtures = async () => {
  bcryptPassword = await encryptPassword('validpassword');

  return {
    users: [f.user({ username: 'validuser', role: UserRole.EDITOR, password: bcryptPassword })],
    settings: [
      {
        site_name: 'Uwazi',
        languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }],
      },
    ],
  };
};

let app: Application;

describe('GET /api/user', () => {
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

    it('should return an empty object for an anonymous request', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

  describe('when v2Login is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi', featureFlags: { v2Login: true } });
    });

    it('should return an empty object for an anonymous request', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return the logged in user without leaking sensitive fields', async () => {
      const loginResponse = await request(app)
        .post('/api/login')
        .send({ username: 'validuser', password: 'validpassword' });

      const cookie = loginResponse.headers['set-cookie'];

      const response = await request(app).get('/api/user').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('validuser');
      expect(response.body.password).toBeUndefined();
      expect(response.body.secret).toBeUndefined();
      expect(response.body.failedLogins).toBeUndefined();
      expect(response.body.accountUnlockCode).toBeUndefined();
      expect(response.body.accountLocked).toBeUndefined();
    });
  });
});
