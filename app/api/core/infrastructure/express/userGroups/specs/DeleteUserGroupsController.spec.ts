import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { DeleteUserGroupsController } from '../DeleteUserGroupsController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  usergroups: [factory.usergroup('One'), factory.usergroup('Two')],
};

const createRoute = (app: Application) => {
  app.delete('/api/usergroups', DeleteUserGroupsController.createHandler());
};

describe('DeleteUserGroupsController integration', () => {
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

  it('should delete a single group by id', async () => {
    const response = await request(app).delete(
      `/api/usergroups?ids=${factory.id('One').toHexString()}`
    );

    expect(response).toHaveStatus(200);
    expect(response.body).toBe(true);

    const usergroups = await testingEnvironment.db.getAllFrom('usergroups');
    expect(usergroups.map((g: any) => g.name)).toEqual(['Two']);
  });

  it('should delete multiple groups by id', async () => {
    const response = await request(app).delete(
      `/api/usergroups?ids=${factory.id('One').toHexString()}&ids=${factory
        .id('Two')
        .toHexString()}`
    );

    expect(response).toHaveStatus(200);
    const usergroups = await testingEnvironment.db.getAllFrom('usergroups');
    expect(usergroups).toHaveLength(0);
  });

  it('should delete groups when ids is sent as a JSON-stringified array', async () => {
    const response = await request(app)
      .delete('/api/usergroups')
      .query({ ids: JSON.stringify([factory.id('One').toHexString()]) });

    expect(response).toHaveStatus(200);
    expect(response.body).toBe(true);

    const usergroups = await testingEnvironment.db.getAllFrom('usergroups');
    expect(usergroups.map((g: any) => g.name)).toEqual(['Two']);
  });

  it('should return 422 when an id is not a valid id', async () => {
    const response = await request(app).delete('/api/usergroups?ids=not-an-id');

    expect(response).toHaveStatus(422);

    const usergroups = await testingEnvironment.db.getAllFrom('usergroups');
    expect(usergroups).toHaveLength(2);
  });

  it('should return 422 when ids is missing', async () => {
    const response = await request(app).delete('/api/usergroups');

    expect(response).toHaveStatus(422);
  });

  it('should ignore unknown query params', async () => {
    const response = await request(app).delete(
      `/api/usergroups?ids=${factory.id('One').toHexString()}&unexpected=1`
    );

    expect(response).toHaveStatus(200);
  });
});
