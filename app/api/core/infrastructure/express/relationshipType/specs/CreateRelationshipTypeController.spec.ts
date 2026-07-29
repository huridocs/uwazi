import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { CreateRelationshipTypeController } from '../CreateRelationshipTypeController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [{ _id: factory.id('existing'), name: 'Existing', properties: [] }],
};

const createRoute = (app: Application) => {
  app.post('/api/relationtypes', CreateRelationshipTypeController.createHandler());
};

describe('CreateRelationshipTypeController integration', () => {
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

  it('should create a relationship type through the controller', async () => {
    const response = await request(app).post('/api/relationtypes').send({ name: 'Created Type' });

    expect(response).toHaveStatus(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      name: 'Created Type',
    });

    const relationtypes = await testingEnvironment.db.getAllFrom('relationtypes');
    expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Created Type' }));
  });

  it('should return 422 for invalid payload', async () => {
    const response = await request(app).post('/api/relationtypes').send({ _id: 7, name: false });
    expect(response).toHaveStatus(422);
  });
});
