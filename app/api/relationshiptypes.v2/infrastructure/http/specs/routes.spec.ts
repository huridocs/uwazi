import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { relationshipTypesRoutes } from '../routes.js';

jest.mock(
  '#api/auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => next()
);

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Type 1', properties: [] },
    { _id: factory.id('rel2'), name: 'Type 2', properties: [] },
    { _id: factory.id('inConnections'), name: 'In Connections', properties: [] },
    { _id: factory.id('inTemplateProp'), name: 'In Template Prop', properties: [] },
  ],
  templates: [
    factory.template('Template using relation type', [
      factory.relationshipProp('rel prop', 'some template', {
        relationType: factory.id('inTemplateProp').toHexString(),
      }),
    ]),
  ],
  connections: [
    {
      _id: factory.id('connection1'),
      title: 'used relation type',
      sourceDocument: 'source1',
      template: factory.id('inConnections'),
    },
  ],
};

describe('relationshiptypes.v2 routes', () => {
  const app: Application = setUpApp(
    relationshipTypesRoutes,
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

  describe('GET /api/relationtypes', () => {
    it('should return all relation types', async () => {
      const response = await request(app).get('/api/relationtypes');

      expect(response).toHaveStatus(200);
      expect(response.body.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Type 1' }),
          expect.objectContaining({ name: 'Type 2' }),
        ])
      );
    });

    it('should return one relation type when _id query is present', async () => {
      const response = await request(app).get(
        `/api/relationtypes?_id=${factory.id('rel1').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body.rows).toHaveLength(1);
      expect(response.body.rows[0]).toMatchObject({ _id: factory.id('rel1').toHexString() });
    });

    it('should return empty rows when relation type id does not exist', async () => {
      const response = await request(app).get(
        `/api/relationtypes?_id=${factory.id('unknown').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body.rows).toEqual([]);
    });
  });

  describe('POST /api/relationtypes', () => {
    it('should create relation type', async () => {
      const response = await request(app).post('/api/relationtypes').send({ name: 'Created Type' });

      expect(response).toHaveStatus(200);
      expect(response.body.name).toBe('Created Type');
      expect(response.body._id).toBeDefined();
    });

    it('should update relation type when payload includes _id', async () => {
      const response = await request(app)
        .post('/api/relationtypes')
        .send({
          _id: factory.id('rel1').toHexString(),
          name: 'Updated Type 1',
          properties: [{ ignored: true }],
        });

      expect(response).toHaveStatus(200);
      expect(response.body).toMatchObject({
        _id: factory.id('rel1').toHexString(),
        name: 'Updated Type 1',
      });
    });

    it('should validate request payload', async () => {
      const response = await request(app).post('/api/relationtypes').send({ _id: 7, name: false });
      expect(response).toHaveStatus(422);
    });
  });

  describe('DELETE /api/relationtypes', () => {
    it('should delete relation type if not used', async () => {
      const response = await request(app).delete(
        `/api/relationtypes?_id=${factory.id('rel1').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body).toBe(true);
    });

    it('should return 400 if relation type is used in template properties', async () => {
      const response = await request(app).delete(
        `/api/relationtypes?_id=${factory.id('inTemplateProp').toHexString()}`
      );

      expect(response).toHaveStatus(400);
      expect(response.body.error).toContain('Cannot delete type being used in templates');
    });

    it('should return false if relation type is used in connections', async () => {
      const response = await request(app).delete(
        `/api/relationtypes?_id=${factory.id('inConnections').toHexString()}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body).toBe(false);
    });

    it('should validate query schema', async () => {
      const response = await request(app).delete('/api/relationtypes');
      expect(response).toHaveStatus(422);
    });
  });
});
