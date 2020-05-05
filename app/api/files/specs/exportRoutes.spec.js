import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import search from 'api/search/search';
import db from 'api/utils/testing_db';

import routes from '../jsRoutes.js';

const mockExport = jest.fn();
jest.mock('api/csv/csvExporter', () =>
  jest.fn().mockImplementation(() => ({ export: mockExport }))
);

describe('export routes', () => {
  beforeEach(async () => {
    const fixtures = {
      settings: [
        {
          site_name: 'uwazi',
          languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }],
        },
      ],
    };
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('/api/export', () => {
    it('temp supertest', async () => {
      mockExport.mockImplementation(() => Promise.resolve());
      const app = setUpApp(routes);
      spyOn(search, 'search').and.returnValue({});

      const res = await request(app)
        .get('/api/export')
        .query({
          filters: '',
          types: '',
          fields: '',
          aggregations: '',
          select: '',
          unpublished: '',
          includeUnpublished: '',
        });
      expect(res).toBe(false);
    });
  });
});
