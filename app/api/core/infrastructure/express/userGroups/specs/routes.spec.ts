import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
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

  it('GET should return member-enriched groups', async () => {
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
