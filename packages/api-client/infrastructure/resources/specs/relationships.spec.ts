import { relationshipsQueryRoutes } from '#api/relationships/query/express/routes.js';
import {
  id,
  relationshipQueryFixtures,
} from '#api/relationships/query/infrastructure/specs/relationshipQueryFixtures.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(relationshipsQueryRoutes);
const sourceEnFile = id('source-en').toString();

describe('relationships client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(relationshipQueryFixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    ['admin', callers.admin, 'source'],
    ['anonymous', callers.anonymous, 'source'],
    ['anonymous on a hidden entity', callers.anonymous, 'hidden'],
  ])(
    'getSummary should match GET /api/relationships/summary (%s)',
    async (_label, caller, sharedId) => {
      const { http, client } = await harness
        .as(caller)
        .outcomes(
          '/api/relationships/summary',
          async c => c.relationships.getSummary({ sharedId }),
          { query: { sharedId } }
        );

      expect(http.status).toBe(200);
      expect(client).toEqual(http);
    }
  );

  it('getSummary should return the readable connections', async () => {
    const body = await harness
      .as(callers.anonymous)
      .client(async c => c.relationships.getSummary({ sharedId: 'source' }));

    expect(body.rows.length).toBeGreaterThan(0);
  });

  it('getAnchors should match GET /api/relationships/anchors', async () => {
    const query = { sharedId: 'source', file: sourceEnFile };
    const { http, client } = await harness
      .as(callers.admin)
      .outcomes('/api/relationships/anchors', async c => c.relationships.getAnchors(query), {
        query,
      });

    expect(http.status).toBe(200);
    expect(client).toEqual(http);
    expect((client.body as { rows: unknown[] }).rows.length).toBeGreaterThan(0);
  });
});
