import { relationshipTypesRoutes } from '#api/core/infrastructure/express/relationshipType/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const factory = getFixturesFactory();
const harness = new ParityHarness(relationshipTypesRoutes);

describe('relationship types client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      relationtypes: [factory.relationType('friend'), factory.relationType('enemy')],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getAll should match GET /api/relationtypes', async () => {
    const http = await harness.as(callers.anonymous).http('/api/relationtypes');
    const client = await harness
      .as(callers.anonymous)
      .client(async c => c.relationshipTypes.getAll());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client.rows).toHaveLength(2);
  });
});
