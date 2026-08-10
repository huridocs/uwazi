import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { GetUserGroupsController } from '../GetUserGroupsController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  users: [factory.user({ username: 'existing1', role: UserRole.ADMIN })],
  usergroups: [factory.usergroup('With member', [{ refId: factory.idString('existing1') }])],
};

const createRoute = (app: Application) => {
  app.get('/api/usergroups', GetUserGroupsController.createHandler());
};

describe('GetUserGroupsController integration', () => {
  const app: Application = setUpApp(
    createRoute,
    (req: Request, _res: Response, next: NextFunction) => {
      req.user = { _id: 'admin', role: 'admin', username: 'admin' };
      next();
    }
  );

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return all groups with enriched members, as a bare array', async () => {
    const response = await request(app).get('/api/usergroups');

    expect(response).toHaveStatus(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([
      {
        _id: factory.id('With member').toHexString(),
        name: 'With member',
        members: [
          {
            refId: factory.idString('existing1'),
            username: 'existing1',
            role: UserRole.ADMIN,
            email: expect.any(String),
          },
        ],
      },
    ]);
  });
});
