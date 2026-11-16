import templateRoutes from '#api/core/infrastructure/express/template/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const factory = getFixturesFactory();
const harness = new ParityHarness(templateRoutes);

describe('templates client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      templates: [
        factory.template('first', [factory.property('text', 'text')]),
        factory.template('second'),
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getAll should match GET /api/templates', async () => {
    const http = await harness.as(callers.anonymous).http('/api/templates');
    const client = await harness.as(callers.anonymous).client(async c => c.templates.getAll());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client.rows).toHaveLength(2);
  });
});
