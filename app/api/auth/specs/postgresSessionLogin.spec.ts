import type { Application } from 'express';
import request from 'supertest';
import { config } from '#api/config.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import authRoutes from '#api/auth/routes.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

const f = getFixturesFactory();

const loginAndLogout = async (app: Application) => {
  const loginResponse = await request(app)
    .post('/api/login')
    .send({ username: 'validuser', password: 'validpassword' });
  const cookie = loginResponse.headers['set-cookie'];
  if (!cookie) {
    throw new Error(`login did not set a cookie (${loginResponse.status})`);
  }

  return {
    loginResponse,
    cookie,
    stored: await testingEnvironment.pg.pool?.query('SELECT sess FROM http_sessions'),
    userResponse: await request(app).get('/api/user').set('Cookie', cookie),
    logoutResponse: await request(app).get('/logout').set('Cookie', cookie),
    afterLogout: await request(app).get('/api/user').set('Cookie', cookie),
  };
};

describe('postgres session login', () => {
  let app: Application;
  const previousBackend = config.sessionsBackend;

  beforeAll(async () => {
    const password = (await EncryptedPassword.create('validpassword')).getValue();
    config.sessionsBackend = 'postgres';
    await testingEnvironment.setUp(
      {
        users: [f.user({ username: 'validuser', role: UserRole.EDITOR, password })],
        settings: [
          {
            site_name: 'Uwazi',
            languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }],
          },
        ],
      },
      { postgres: true, postgresMirror: [] }
    );
    testingTenants.changeCurrentTenant({ domain: 'uwazi' });
    app = setUpApp(authRoutes);
  });

  afterAll(async () => {
    config.sessionsBackend = previousBackend;
    await testingEnvironment.tearDown();
  });

  it('should keep the logged-in user in http_sessions and drop it on logout', async () => {
    const { loginResponse, stored, userResponse, logoutResponse, afterLogout } =
      await loginAndLogout(app);

    expect(loginResponse.status).toBe(200);
    expect(stored?.rows).toEqual([
      { sess: expect.objectContaining({ passport: { user: expect.stringContaining('///') } }) },
    ]);
    expect(String(stored?.rows[0].sess.passport.user)).toContain(`///${testingDB.dbName}`);
    expect(userResponse.body).toMatchObject({ username: 'validuser' });
    expect(logoutResponse.status).toBe(302);
    expect(afterLogout.body).toEqual({});
  });
});
