import 'isomorphic-fetch';
import request from 'supertest';

import routes from '#api/entities/routes.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

describe('GET /api/entities/count_by_template', () => {
  const app = setUpApp(routes);

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [{ key: 'en', label: 'English', default: true }],
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('rejects a templateId that is not a 24 character hex string', async () => {
    const response = await request(app)
      .get('/api/entities/count_by_template')
      .query({ templateId: 'x' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ prettyMessage: 'validation failed' }));
  });

  it('returns 0 when the template id is well formed and unknown', async () => {
    const response = await request(app)
      .get('/api/entities/count_by_template')
      .query({ templateId: '507f1f77bcf86cd799439011' });

    expect(response.status).toBe(200);
    expect(response.body).toBe(0);
  });
});
