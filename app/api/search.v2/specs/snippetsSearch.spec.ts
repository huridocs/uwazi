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
      .get(`/api/v2/entity/${sharedId}/snippets`)
      .query({ filter: { searchString } })
      .expect(200);
  }

  it('should return the metadata and fullText snippets of a document', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'searched');
    const snippets = body.data;
    expect(snippets.count).toBe(3);
    expect(snippets.metadata.length).toBe(1);
    expect(snippets.metadata[0].texts[0]).toContain('<b>searched</b>');
    expect(snippets.fullText.length).toBe(2);
    expect(snippets.fullText[0].page).toBe(2);
    expect(snippets.fullText[0].text).toContain('<b>searched</b>');
    expect(snippets.fullText[0].text).not.toContain('[[2]]');
    expect(snippets.fullText[1].page).toBe(4);
    expect(snippets.fullText[1].text).toContain('<b>searched</b>');
    expect(snippets.fullText[1].text).not.toContain('[[4]]');
  });

  it('should return empty snippets if there is not matches', async () => {
    const { body } = await searchEntitySnippets('entity1SharedId', 'nonexistent');
    const snippets = body.data;
    expect(snippets.count).toBe(0);
    expect(snippets.metadata.length).toBe(0);
    expect(snippets.fullText.length).toBe(0);
  });

  it('should return empty snippets if there is no searchString', async () => {
    try {
      const { body } = await searchEntitySnippets('entity2SharedId', undefined);
      expect(body.data.count).toBe(0);
    } catch (e) {
      fail('should not throw an exception');
    }
  });

  it('should return only the metadata snippets if there is no fullText matches', async () => {
    const { body } = await searchEntitySnippets('entity2SharedId', 'fulltext');
    const snippets = body.data;
    expect(snippets.count).toBe(1);
    expect(snippets.metadata.length).toBe(1);
    expect(snippets.metadata[0].texts[0]).toContain('<b>fulltext</b>');
    expect(snippets.fullText.length).toBe(0);
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
      expect(body.data.count).toBe(0);
    });

    it('should return the snippets of a public document', async () => {
      const { body } = await searchEntitySnippets('entity3SharedId', 'searched');
      const snippets = body.data;
      expect(snippets.count).toBe(1);
      expect(snippets.metadata.length).toBe(1);
      expect(snippets.metadata[0].texts[0]).toContain('<b>searched</b>');
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
      expect(body.data.count).toBe(0);
    });

    it('should return the snippets of a private document shared with her', async () => {
      const { body } = await searchEntitySnippets('entity4SharedId', 'searched');
      const snippets = body.data;
      expect(snippets.count).toBe(1);
      expect(snippets.metadata.length).toBe(1);
      expect(snippets.metadata[0].texts[0]).toContain('<b>searched</b>');
    });
  });
});
