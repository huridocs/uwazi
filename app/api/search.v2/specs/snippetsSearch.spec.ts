import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { searchRoutes } from 'api/search.v2/routes';
import { testingDB } from 'api/utils/testing_db';
import { fixturesSnippetsSearch } from 'api/search.v2/specs/snippetsSearchFixtures';
import request from 'supertest';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

describe('searchSnippets', () => {
  const app: Application = setUpApp(searchRoutes);
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesSnippetsSearch, 'entities.v2.snippets_search');
  });

  afterAll(async () => testingDB.disconnect());

  it('should return the metadata and fullText snippets of a document', async () => {
    const { body } = await request(app)
      .get('/api/v2/entity/entity1SharedId/snippets')
      .query({ filter: { searchString: 'searched' } })
      .expect(200);
    const snippets = body.data;
    expect(snippets.count).toBe(2);
    expect(snippets.metadata.length).toBe(1);
    expect(snippets.metadata[0].texts[0]).toContain('<b>searched</b>');
    expect(snippets.fullText.length).toBe(1);
    expect(snippets.fullText[0].page).toBe(1);
    expect(snippets.fullText[0].text).toContain('<b>searched</b>');
    expect(snippets.fullText[0].text).not.toContain('[[1]]');
  });

  it('should return empty snippets if there is not matches', async () => {
    const { body } = await request(app)
      .get('/api/v2/entity/entity1SharedId/snippets')
      .query({ filter: { searchString: 'nonexistent' } })
      .expect(200);
    const snippets = body.data;
    expect(snippets.count).toBe(0);
    expect(snippets.metadata.length).toBe(0);
    expect(snippets.fullText.length).toBe(0);
  });

  it('should return empty snippets if there is no searchString', async () => {
    try {
      const { body } = await request(app)
        .get('/api/v2/entity/entity2SharedId/snippets')
        .query({ filter: { searchString: undefined } })
        .expect(200);
      expect(body.data.count).toBe(0);
    } catch (e) {
      fail('should not throw an exception');
    }
  });

  it('should return only the metadata snippets if there is no fullText matches', async () => {
    const { body } = await request(app)
      .get('/api/v2/entity/entity2SharedId/snippets')
      .query({ filter: { searchString: 'fulltext' } })
      .expect(200);
    const snippets = body.data;
    expect(snippets.count).toBe(1);
    expect(snippets.metadata.length).toBe(1);
    expect(snippets.metadata[0].texts[0]).toContain('<b>fulltext</b>');
    expect(snippets.fullText.length).toBe(0);
  });

  it('should support no valid lucene syntax', async () => {
    try {
      const { body } = await request(app)
        .get('/api/v2/entity/entity2SharedId/snippets')
        .query({ filter: { searchString: 'fulltext OR' } })
        .expect(200);
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
      const { body } = await request(app)
        .get('/api/v2/entity/entity1SharedId/snippets')
        .query({ filter: { searchString: 'searched' } })
        .expect(200);
      expect(body.data.count).toBe(0);
    });

    it('should return the snippets of a public document', async () => {
      const { body } = await request(app)
        .get('/api/v2/entity/entity3SharedId/snippets')
        .query({ filter: { searchString: 'searched' } })
        .expect(200);
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
      const { body } = await request(app)
        .get('/api/v2/entity/entity1SharedId/snippets')
        .query({ filter: { searchString: 'searched' } })
        .expect(200);
      expect(body.data.count).toBe(0);
    });

    it('should return the snippets of a private document shared with her', async () => {
      const { body } = await request(app)
        .get('/api/v2/entity/entity4SharedId/snippets')
        .query({ filter: { searchString: 'searched' } })
        .expect(200);
      const snippets = body.data;
      expect(snippets.count).toBe(1);
      expect(snippets.metadata.length).toBe(1);
      expect(snippets.metadata[0].texts[0]).toContain('<b>searched</b>');
    });
  });
});
