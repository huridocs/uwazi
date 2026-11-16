import { ActivityLogComposition } from '#activitylog/composition';
import { listEntries } from '../../../../activitylog/application/specs/ActivityLogContractFixtures.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import type { ActivityLogQuery } from '../../../application/contracts/ActivityLog.js';
import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(ActivityLogComposition.registerRoutes);

describe('activity log client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      activitylogs: listEntries,
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each<[string, ActivityLogQuery]>([
    ['the first page', {}],
    [
      'a filtered, sorted page',
      { method: ['DELETE'], sort: { prop: 'time', asc: 1 }, limit: 2, page: 1 },
    ],
    ['a time range', { time: { from: 1, to: 9999999999 } }],
  ])('list should match GET /api/activitylog for %s', async (_label, query) => {
    const { http, client } = await harness
      .as(callers.admin)
      .outcomes('/api/activitylog', async c => c.activityLog.list(query), {
        query,
        encoding: 'json',
      });

    expect(http.status).toBe(200);
    expect(client).toEqual(http);
  });

  it('list should return the entries', async () => {
    const body = await harness.as(callers.admin).client(async c => c.activityLog.list());

    expect(body.rows).toHaveLength(listEntries.length);
  });

  it.each([
    ['editor', callers.editor],
    ['anonymous', callers.anonymous],
  ])('list should be forbidden to %s like the route', async (_label, caller) => {
    const { http, client } = await harness
      .as(caller)
      .outcomes('/api/activitylog', async c => c.activityLog.list(), { encoding: 'json' });

    expect(http.status).toBe(401);
    expect(client).toEqual(http);
  });

  it('list should reject an invalid query with 400 like the route', async () => {
    const query = { limit: 'many' };
    const { http, client } = await harness.as(callers.admin).outcomes(
      '/api/activitylog',
      // @ts-expect-error an invalid limit is what is being tested
      async c => c.activityLog.list(query),
      { query, encoding: 'json' }
    );

    expect(http.status).toBe(400);
    expect(client).toEqual(http);
  });
});
