import { routes as thesauriRoutes } from '#api/core/v1_layer/thesauri/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const factory = getFixturesFactory();
const harness = new ParityHarness(thesauriRoutes);

describe('thesauri client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      dictionaries: [factory.thesauri('colors', ['red', 'blue']), factory.thesauri('sizes', ['s'])],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getAll should match GET /api/dictionaries', async () => {
    const http = await harness.as(callers.anonymous).http('/api/dictionaries');
    const client = await harness.as(callers.anonymous).client(async c => c.thesauri.getAll());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client.rows).toHaveLength(2);
  });

  it('getAll with an _id should match GET /api/dictionaries?_id=', async () => {
    const _id = factory.idString('colors');

    const http = await harness.as(callers.anonymous).http('/api/dictionaries', { _id });
    const client = await harness
      .as(callers.anonymous)
      .client(async c => c.thesauri.getAll({ _id }));

    expect(client).toEqual(http.body);
    expect(client.rows).toMatchObject([{ name: 'colors' }]);
  });
});
