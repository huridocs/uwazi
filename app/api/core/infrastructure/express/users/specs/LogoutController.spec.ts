import type { Application } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import authRoutes from '#api/auth/routes.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

const f = getFixturesFactory();

let bcryptPassword: string;

const buildFixtures = async () => {
  bcryptPassword = (await EncryptedPassword.create('validpassword')).getValue();

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

describe('GET /logout', () => {
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

  describe('logging out', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi' });
    });

    it('should destroy the session and redirect home', async () => {
      const loginResponse = await request(app)
        .post('/api/login')
        .send({ username: 'validuser', password: 'validpassword' });

      const cookie = loginResponse.headers['set-cookie'];

      const logoutResponse = await request(app).get('/logout').set('Cookie', cookie);

      expect(logoutResponse.status).toBe(302);
      expect(logoutResponse.headers.location).toBe('/');

      const userResponse = await request(app).get('/api/user').set('Cookie', cookie);
      expect(userResponse.body).toEqual({});
    });

    it('should log out an anonymous request without error', async () => {
      const response = await request(app).get('/logout');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });
});
