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

  async function searchEntitySnippets(sharedId: string, searchString: string | undefined) {
    return request(app)
      .get(`/api/v2/entities/${sharedId}/snippets`)
      .query({ filter: { searchString } })
      .expect(200);
  }

  it('should return the metadata and fullText snippets of a document', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
    const snippets = body.data;
    const matches = expect.stringContaining('<b>searched</b>');
    const expected = {
      count: 4,
      metadata: [
        { field: 'metadata.property1.value', texts: [matches] },
        { field: 'title', texts: [matches] },
      ],
      fullText: [
        { page: 2, text: matches },
        { page: 4, text: matches },
      ],
    };
    expect(snippets).toEqual(expected);
  });

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

  it('should return only the metadata snippets if there is no fullText matches', async () => {
    const { body } = await searchEntitySnippets('entity2SharedId', 'fulltext');
    const snippets = body.data;
    const expected = {
      count: 1,
      metadata: [{ field: 'title', texts: [expect.stringContaining('<b>fulltext</b>')] }],
      fullText: [],
    };
    expect(snippets).toEqual(expected);
  });

  it('should support no valid lucene syntax', async () => {
    try {
      const { body } = await searchEntitySnippets('entity2SharedId', 'fulltext OR');
      expect(body.data.count).toBe(1);
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
      const matches = expect.stringContaining('<b>searched</b>');
      const expected = {
        count: 2,
        metadata: [
          { field: 'metadata.property2.value', texts: [matches] },
          { field: 'title', texts: [matches] },
        ],
        fullText: [],
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
        metadata: [{ field: 'title', texts: [expect.stringContaining('<b>searched</b>')] }],
        fullText: [],
      };
      expect(body.data).toEqual(expected);
    });
  });
});
