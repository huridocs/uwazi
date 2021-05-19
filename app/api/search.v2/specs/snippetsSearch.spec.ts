import qs from 'qs';
import request from 'supertest';
import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { searchRoutes } from 'api/search.v2/routes';
import { testingDB } from 'api/utils/testing_db';
import { fixturesSnippetsSearch } from 'api/search.v2/specs/snippetsSearchFixtures';

describe('searchSnippets', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesSnippetsSearch, 'entities.v2.snippets_search');
  });

  afterAll(async () => testingDB.disconnect());

  async function searchEntitySnippets(sharedId: string, searchString: string) {
    return request(app)
      .get('/api/v2/entities')
      .query(qs.stringify({ filter: { sharedId, searchString }, fields: ['snippets'] }))
      .expect(200);
  }

  it('should return fullText snippets of an entity', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
    const snippets = body.data;
    const matches = expect.stringContaining('<b>searched</b>');
    const expected = [
      expect.objectContaining({
        snippets: {
          count: 2,
          metadata: [],
          fullText: [
            { page: 2, text: matches },
            { page: 4, text: matches },
          ],
        },
      }),
    ];
    expect(snippets).toEqual(expected);
  });

  it.each`
    searchString         | firstResultSharedId  | total
    ${'searched'}        | ${'entity1SharedId'} | ${2}
    ${'title:(private)'} | ${'entity3SharedId'} | ${1}
    ${undefined}         | ${'entity1SharedId'} | ${3}
  `(
    'should not return snippets if they are not requested for $searchString',
    async ({ searchString, firstResultSharedId, total }) => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString } })
        .expect(200);
      expect(body.data.length).toBe(total);
      const [entity] = body.data;
      expect(entity.sharedId).toEqual(firstResultSharedId);
      expect(entity.snippets).toBeUndefined();
    }
  );

  it('should not return entities if no fullText search matches', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'nonexistent');
    expect(body.data.length).toBe(0);
  });

  it('should support no valid lucene syntax', async () => {
    try {
      const { body } = await searchEntitySnippets('entity3SharedId', 'fulltext OR');
      expect(body.data.length).toBe(0);
    } catch (e) {
      fail('should not throw an exception');
    }
  });
});
