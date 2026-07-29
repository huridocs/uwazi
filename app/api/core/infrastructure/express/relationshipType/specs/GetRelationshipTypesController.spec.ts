import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { GetRelationshipTypesController } from '../GetRelationshipTypesController.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Type 1', properties: [] },
    { _id: factory.id('rel2'), name: 'Type 2', properties: [] },
  ],
};

const getRoute = (app: Application) => {
  app.get('/api/relationtypes', GetRelationshipTypesController.createHandler());
};

describe('GetRelationshipTypesController integration', () => {
  const app: Application = setUpApp(
    getRoute,
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

  it('should return all relation types through the controller', async () => {
    const response = await request(app).get('/api/relationtypes');

    expect(response).toHaveStatus(200);
    expect(response.body.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: factory.id('rel1').toHexString(), name: 'Type 1' }),
        expect.objectContaining({ _id: factory.id('rel2').toHexString(), name: 'Type 2' }),
      ])
    );
  });

  it('should return one relation type when _id query is present', async () => {
    const response = await request(app).get(
      `/api/relationtypes?_id=${factory.id('rel2').toHexString()}`
    );

    expect(response).toHaveStatus(200);
    expect(response.body.rows).toEqual([
      expect.objectContaining({ _id: factory.id('rel2').toHexString(), name: 'Type 2' }),
    ]);
  });
});
