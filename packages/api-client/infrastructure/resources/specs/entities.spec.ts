import entitiesRoutes from '#api/entities/routes.js';
import { relationshipQueryFixtures } from '#api/relationships/query/infrastructure/specs/relationshipQueryFixtures.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import type { EntityQuery } from '../../../application/contracts/Entities.js';
import { ParityHarness, callers } from './ParityHarness.js';

const harness = new ParityHarness(entitiesRoutes);

describe('entities client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(relationshipQueryFixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each<[string, (typeof callers)[keyof typeof callers], EntityQuery]>([
    ['a published entity, anonymously', callers.anonymous, { sharedId: 'source' }],
    [
      'an entity with typed flags',
      callers.admin,
      { sharedId: 'source', omitRelationships: true, include: ['permissions', 'translations'] },
    ],
    ['an unpublished entity, as admin', callers.admin, { sharedId: 'secret' }],
    ['an unpublished entity, anonymously', callers.anonymous, { sharedId: 'secret' }],
    ['a missing entity', callers.admin, { sharedId: 'missing' }],
  ])('get should match GET /api/entities for %s', async (_label, caller, query) => {
    const { http, client } = await harness
      .as(caller)
      .outcomes('/api/entities', async c => c.entities.get(query), { query, encoding: 'json' });

    expect(client).toEqual(http);
  });

  it('get should return the entity row', async () => {
    const body = await harness
      .as(callers.anonymous)
      .client(async c => c.entities.get({ sharedId: 'source' }));

    expect(body.rows).toMatchObject([{ sharedId: 'source', title: 'Source EN' }]);
  });

  it('get should reject an invalid query with 400, like the route', async () => {
    const query = { sharedId: 'source', include: ['unknown'] };
    const { http, client } = await harness.as(callers.admin).outcomes(
      '/api/entities',
      // @ts-expect-error an invalid include is what is being tested
      async c => c.entities.get(query),
      { query, encoding: 'json' }
    );

    expect(http.status).toBe(400);
    expect(client).toEqual(http);
  });
});
