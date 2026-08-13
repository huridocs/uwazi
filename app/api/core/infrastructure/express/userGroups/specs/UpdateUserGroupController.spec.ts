import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UpdateUserGroupController } from '../UpdateUserGroupController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  usergroups: [factory.usergroup('Existing')],
};

const createRoute = (app: Application) => {
  app.post('/api/usergroups', UpdateUserGroupController.createHandler());
};

describe('UpdateUserGroupController integration', () => {
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

  it('should update a group through the controller', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({ _id: factory.id('Existing').toHexString(), name: 'Renamed', members: [] });

    expect(response).toHaveStatus(200);
    expect(response.body).toEqual({
      _id: factory.id('Existing').toHexString(),
      name: 'Renamed',
      members: [],
    });
  });

  it('should return 422 when _id is missing', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({ name: 'Renamed', members: [] });

    expect(response).toHaveStatus(422);
  });

  it('should return 422 for an unexpected extra field', async () => {
    const response = await request(app)
      .post('/api/usergroups')
      .send({
        _id: factory.id('Existing').toHexString(),
        name: 'Renamed',
        members: [],
        other: 'invalid',
      });

    expect(response).toHaveStatus(422);
  });
});
