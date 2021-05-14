import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { searchRoutes } from 'api/search.v2/routes';
import { testingDB } from 'api/utils/testing_db';
import { fixturesSnippetsSearch } from 'api/search.v2/specs/snippetsSearchFixtures';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import request from 'supertest';

describe('searchSnippets', () => {
  const app: Application = setUpApp(searchRoutes);
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesSnippetsSearch, 'entities.v2.snippets_search');
  });

  afterAll(async () => testingDB.disconnect());

  async function searchEntitySnippets(sharedId: string, fullTextTerm: string | undefined) {
    const searchString = `sharedId.raw:(${sharedId}), fullText:(${fullTextTerm})`;
    return request(app)
      .get('/api/v2/entities')
      .query({ filter: { searchString }, fullTextSnippets: true })
      .expect(200);
  }

  it('should return fullText snippets of a document', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
    const snippets = body.data;
    const matches = expect.stringContaining('<b>searched</b>');
    const expected = {
      count: 2,
      metadata: [],
      fullText: [
        { page: 2, text: matches },
        { page: 4, text: matches },
      ],
    };
    expect(snippets).toEqual(expected);
  });

  it.each`
    searchString                              | firstResultSharedId  | total
    ${'fullText:(searched)'}                  | ${'entity1SharedId'} | ${3}
    ${'title:(private), fullText:(searched)'} | ${'entity4SharedId'} | ${1}
    ${undefined}                              | ${'entity1SharedId'} | ${4}
  `(
    'should return a standard result if fullTextSnippets is not required',
    async ({ searchString, firstResultSharedId, total }) => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString } })
        .expect(200);
      expect(body.data.length).toBe(total);
      const [entity] = body.data;
      expect(entity.sharedId).toEqual(firstResultSharedId);
    }
  );

  it('should return empty snippets if there is not matches', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'nonexistent');
    const snippets = body.data;
    expect(snippets).toEqual({ count: 0, metadata: [], fullText: [] });
  });

  it('should return empty snippets if there is no searchString', async () => {
    try {
      const { body } = await searchEntitySnippets('entity2SharedId', undefined);
      expect(body.data).toEqual({ count: 0, metadata: [], fullText: [] });
    } catch (e) {
      fail('should not throw an exception');
    }
  });

  it('should support no valid lucene syntax', async () => {
    try {
      const { body } = await searchEntitySnippets('entity2SharedId', 'fulltext OR');
      expect(body.data.count).toBe(0);
    } catch (e) {
      fail('should not throw an exception');
    }
  });

  describe('logged out user', () => {
    beforeAll(async () => {
      userFactory.mock(undefined);
    });

    it('should not return private documents', async () => {
      const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
      expect(body.data).toEqual({ count: 0, metadata: [], fullText: [] });
    });

    it('should return the snippets of a public document', async () => {
      const { body } = await searchEntitySnippets('entity3SharedId', 'searched');
      const snippets = body.data;
      const expected = {
        count: 1,
        metadata: [],
        fullText: [{ page: 3, text: expect.stringContaining('<b>searched</b>') }],
      };
      expect(snippets).toEqual(expected);
    });
  });

  describe('collaborator user', () => {
    beforeAll(async () => {
      userFactory.mock({
        _id: 'user1',
        role: 'collaborator',
        username: 'user1',
        email: 'col@test.test',
      });
    });

    it('should not return not shared private documents', async () => {
      const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
      expect(body.data).toEqual({ count: 0, metadata: [], fullText: [] });
    });

    it('should return the snippets of a private document shared with her', async () => {
      const { body } = await searchEntitySnippets('entity4SharedId', 'searched');
      const expected = {
        count: 1,
        metadata: [],
        fullText: [{ page: 4, text: expect.stringContaining('<b>searched</b>') }],
      };
      expect(body.data).toEqual(expected);
    });
  });
});
