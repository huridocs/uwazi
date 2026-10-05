import type { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { setUpApp } from '#api/utils/testingRoutes.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
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
      relationtypes: [factory.relationType('rel1'), factory.relationType('rel2')],
      connections: factory.bidirectionalHub('hub1', { entity: 'e1', template: 'rel1' }, [
        { entity: 'e2', template: 'rel1' },
        { entity: 'e3', template: 'rel2' },
      ]),
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/references/count_by_relationtype', () => {
    it('should return counts keyed by id for comma-separated relationtypeIds', async () => {
      const ids = [factory.idString('rel1'), factory.idString('rel2'), factory.idString('unused')];
      const { body, status } = await request(app)
        .get('/api/references/count_by_relationtype')
        .query({ relationtypeIds: ids.join(',') });

      expect(status).toBe(200);
      expect(body).toEqual({ [ids[0]]: 2, [ids[1]]: 1, [ids[2]]: 0 });
    });

    it('should reject invalid relationtypeIds', async () => {
      const { status } = await request(app)
        .get('/api/references/count_by_relationtype')
        .query({ relationtypeIds: 'invalid-id' });

      expect(status).toBe(400);
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
