import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UpdateRelationshipTypeController } from '../UpdateRelationshipTypeController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [{ _id: factory.id('rel1'), name: 'Type 1', properties: [] }],
};

const updateRoute = (app: Application) => {
  app.post('/api/relationtypes', UpdateRelationshipTypeController.createHandler());
};

describe('UpdateRelationshipTypeController integration', () => {
  const app: Application = setUpApp(
    updateRoute,
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

  it('should update a relationship type through the controller', async () => {
    const response = await request(app)
      .post('/api/relationtypes')
      .send({
        _id: factory.id('rel1').toHexString(),
        name: 'Type 1 Updated',
        properties: [{ ignored: true }],
      });

    expect(response).toHaveStatus(200);
    expect(response.body).toEqual({
      _id: factory.id('rel1').toHexString(),
      name: 'Type 1 Updated',
    });

    const relationtypes = await testingEnvironment.db.getAllFrom('relationtypes');
    expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Type 1 Updated' }));
  });

  it('should return 422 for invalid payload', async () => {
    const response = await request(app).post('/api/relationtypes').send({ _id: 7, name: false });
    expect(response).toHaveStatus(422);
  });
});
