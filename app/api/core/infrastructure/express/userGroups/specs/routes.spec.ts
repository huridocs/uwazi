import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';
import { userGroupsRoutes } from '../routes.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  users: [factory.user({ username: 'existing1', role: UserRole.ADMIN })],
  usergroups: [factory.usergroup('Existing', [{ refId: factory.idString('existing1') }])],
};

const app: Application = setUpApp(
  userGroupsRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: 'admin', role: 'admin', username: 'admin' };
    next();
  }
);

describe('userGroupsRoutes', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when v2Usergroups is off (default)', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ featureFlags: { v2Usergroups: false } });
    });

    it('GET should return legacy member-enriched groups', async () => {
      const response = await request(app).get('/api/usergroups');

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject([
        {
          name: 'Existing',
          members: [{ refId: factory.idString('existing1'), username: 'existing1' }],
        },
      ]);
    });

    it('POST should create through the legacy service', async () => {
      const response = await request(app)
        .post('/api/usergroups')
        .send({ name: 'Legacy Created', members: [] });

      expect(response).toHaveStatus(200);
      const stored = await testingEnvironment.db.getAllFrom('usergroups');
      expect(stored).toContainEqual(expect.objectContaining({ name: 'Legacy Created' }));
    });

    it('DELETE should require the ids query param', async () => {
      const response = await request(app).delete('/api/usergroups');
      expect(response).toHaveStatus(400);
    });

    it('DELETE should delete through the legacy service', async () => {
      const response = await request(app).delete(
        `/api/usergroups?ids=${factory.id('Existing').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      const stored = await testingEnvironment.db.getAllFrom('usergroups');
      expect(stored).toHaveLength(0);
    });
  });

  describe('when v2Usergroups is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ featureFlags: { v2Usergroups: true } });
    });

    it('GET should return V2 member-enriched groups', async () => {
      const response = await request(app).get('/api/usergroups');

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject([
        {
          name: 'Existing',
          members: [{ refId: factory.idString('existing1'), username: 'existing1' }],
        },
      ]);
    });

    it('POST without _id should create via CreateUserGroupController', async () => {
      const response = await request(app)
        .post('/api/usergroups')
        .send({ name: 'V2 Created', members: [] });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({ name: 'V2 Created' });
    });

    it('POST with _id should update via UpdateUserGroupController', async () => {
      const response = await request(app)
        .post('/api/usergroups')
        .send({ _id: factory.id('Existing').toHexString(), name: 'V2 Renamed', members: [] });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({ name: 'V2 Renamed' });
    });

    it('DELETE should delete via DeleteUserGroupsController', async () => {
      const response = await request(app).delete(
        `/api/usergroups?ids=${factory.id('Existing').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body).toBe(true);
    });
  });
});
