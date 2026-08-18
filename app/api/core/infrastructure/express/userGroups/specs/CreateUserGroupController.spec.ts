import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { CreateUserGroupController } from '../CreateUserGroupController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  usergroups: [factory.usergroup('Existing')],
};

const createRoute = (app: Application) => {
  app.post('/api/usergroups', CreateUserGroupController.createHandler());
};

describe('CreateUserGroupController integration', () => {
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

  it('should create a group through the controller', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({ name: 'Created Group', members: [] });

    expect(response).toHaveStatus(200);
    expect(response.body).toEqual({ _id: expect.any(String), name: 'Created Group', members: [] });

    const usergroups = await testingEnvironment.db.getAllFrom('usergroups');
    expect(usergroups).toContainEqual(expect.objectContaining({ name: 'Created Group' }));
  });

  it('should return 422 for an unexpected extra field', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({ name: 'Extra', members: [], other: 'invalid' });

    expect(response).toHaveStatus(422);
  });

  it('should return 422 for a member missing refId', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({ name: 'BadMember', members: [{}] });

    expect(response).toHaveStatus(422);
  });
});
