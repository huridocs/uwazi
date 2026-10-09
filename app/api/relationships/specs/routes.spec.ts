import type { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';

import { setUpApp } from '#api/utils/testingRoutes.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import routes from '../routes.js';

const factory = getFixturesFactory();

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('relationships routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'EN', default: true }] }],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('returns every relation type count when no id is passed', async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'EN', default: true }] }],
      relationtypes: [
        factory.relationType('rel1'),
        factory.relationType('rel2'),
        factory.relationType('unused'),
      ],
      connections: factory.bidirectionalHub('hub1', { entity: 'e1', template: 'rel1' }, [
        { entity: 'e2', template: 'rel1' },
        { entity: 'e3', template: 'rel2' },
      ]),
    });

    const { body, status } = await request(app).get('/api/references/count_by_relationtype');

    expect(status).toBe(200);
    expect(body).toEqual({
      [factory.idString('rel1')]: 2,
      [factory.idString('rel2')]: 1,
      [factory.idString('unused')]: 0,
    });
  });

  describe('POST/bulk', () => {
    it('should validate connections', async () => {
      const { body } = await request(app)
        .post('/api/relationships/bulk')
        .send({ save: [{ notAllowedProperty: 'test' }], delete: [] });

      expect(body.prettyMessage).toBe('validation failed\n/0: must NOT have additional properties');
    });

    it('should throw an especial 500 error when selectionRectangles is sent empty', async () => {
      const { body, status } = await request(app)
        .post('/api/relationships/bulk')
        .send({ save: [{ reference: { text: 'test', selectionRectangles: [] } }], delete: [] });

      expect(status).toBe(400);
      expect(body.error.match(/selectionRectangles should not be empty/)).not.toBe(null);
    });
  });
});
