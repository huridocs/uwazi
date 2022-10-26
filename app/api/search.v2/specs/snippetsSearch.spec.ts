import qs from 'qs';
import request from 'supertest';
import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { searchRoutes } from 'api/search.v2/routes';
import { testingDB } from 'api/utils/testing_db';
import { advancedSort } from 'app/utils/advancedSort';

import entities from 'api/entities';
import { elasticTesting } from 'api/utils/elastic_testing';
import { SearchQuery } from 'shared/types/SearchQueryType';
import { fixturesSnippetsSearch, entity1enId, entity2enId } from './fixturesSnippetsSearch';

describe('searchSnippets', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesSnippetsSearch, 'entities.v2.snippets_search');
    await entities.save(await entities.getById({ _id: entity2enId.toString() }), {
      user: {},
      language: 'en',
    });
    await elasticTesting.refresh();
  });

  afterAll(async () => testingDB.disconnect());

  async function search(filter: SearchQuery['filter'], fields = ['snippets', 'title']) {
    return request(app).get('/api/v2/search').query(qs.stringify({ filter, fields })).expect(200);
  }

  it('should return fullText snippets of an entity', async () => {
    const { body } = await search({
      sharedId: 'entity1SharedId',
      searchString: 'fullText:(searched)',
    });
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
    searchString             | firstResultSharedId  | total
    ${'fullText:(searched)'} | ${'entity1SharedId'} | ${2}
    ${'title:(private)'}     | ${'entity3SharedId'} | ${1}
    ${'private'}             | ${'entity3SharedId'} | ${1}
    ${'"entity:with"'}       | ${'entity4SharedId'} | ${1}
    ${undefined}             | ${'entity1SharedId'} | ${4}
  `(
    'should not return snippets if they are not requested for $searchString',
    async ({ searchString, firstResultSharedId, total }) => {
      const { body } = await search({ searchString }, []);
      expect(body.data.length).toBe(total);
      const [entity] = body.data;
      expect(entity.sharedId).toEqual(firstResultSharedId);
      expect(entity.snippets).toBeUndefined();
    }
  );

  it('should not return entities if no fullText search matches', async () => {
    const { body } = await search({
      sharedId: 'entity1SharedId',
      searchString: 'fullText:(nonexistent)',
    });
    expect(body.data.length).toBe(0);
  });

  it('should support non-valid lucene syntax', async () => {
    try {
      const { body } = await search({ sharedId: 'entity3SharedId', searchString: 'fulltext OR' });
      expect(body.data.length).toBe(1);
    } catch (e) {
      fail('should not throw an exception');
    }
  });

  it('should return a simple search if search term contains :', async () => {
    const { body } = await search({
      sharedId: 'entity4SharedId',
      searchString: 'fullText:("searched:term")',
    });
    expect(body.data.length).toBe(1);
    const expected = [
      expect.objectContaining({
        snippets: {
          count: 1,
          metadata: [],
          fullText: [{ page: 2, text: expect.stringContaining('<b>searched:term</b>') }],
        },
      }),
    ];
    expect(body.data).toEqual(expected);
  });

  it('should return snippets in conjunction with other fields asked', async () => {
    const { body } = await search({
      sharedId: 'entity1SharedId',
      searchString: 'fullText:(searched)',
    });
    const expected = [
      {
        _id: entity1enId.toString(),
        title: 'entity with a document',
        snippets: {
          count: 2,
          metadata: [],
          fullText: [
            { page: 2, text: expect.stringContaining('<b>searched</b>') },
            { page: 4, text: expect.stringContaining('<b>searched</b>') },
          ],
        },
      },
    ];
    expect(body.data).toMatchObject(expected);
  });

  it('should return title snippets of an entity', async () => {
    const { body } = await request(app)
      .get('/api/v2/search')
      .query(
        qs.stringify({
          filter: { searchString: 'title:("entity:with")' },
          fields: ['snippets', 'title'],
        })
      )
      .expect(200);

    expect(body.data).toMatchObject([
      {
        snippets: {
          count: 1,
          metadata: [
            {
              field: 'title',
              texts: ['<b>entity:with</b> a document'],
            },
          ],
        },
      },
    ]);
  });

  it('should return metadata snippets of an entity', async () => {
    const expected = [
      {
        snippets: {
          count: 2,
          metadata: [
            {
              field: 'metadata.markdown_field.value',
              texts: ['Another <b>short</b> string'],
            },
            {
              field: 'metadata.text_field.value',
              texts: ['A <b>short</b> string that we know it&#x27;s going to come with a snippet'],
            },
          ],
        },
      },
      {
        snippets: {
          count: 1,
          metadata: [
            {
              field: 'metadata.text_field.value',
              texts: ['Tests are not <b>short</b>'],
            },
          ],
        },
      },
    ];

    const { body } = await request(app)
      .get('/api/v2/search')
      .query(
        qs.stringify({
          filter: { searchString: 'short' },
          fields: ['snippets', 'title'],
        })
      )
      .expect(200);
    const results = body.data;
    const firstResultSnippets = advancedSort(results[0].snippets.metadata, { property: 'field' });
    const secondResultSnippets = advancedSort(results[1].snippets.metadata, { property: 'field' });

    expect(results.length).toBe(2);

    expect(results[0].snippets.count).toBe(2);
    expect(firstResultSnippets).toMatchObject(expected[0].snippets.metadata);

    expect(results[1].snippets.count).toBe(1);
    expect(secondResultSnippets).toMatchObject(expected[1].snippets.metadata);
  });

  it('should return snippets for denormalized labels', async () => {
    const { body } = await search({ searchString: 'Republic' });
    const results = body.data;

    expect(results).toMatchObject([
      {
        snippets: {
          count: 1,
          metadata: [
            {
              field: 'metadata.thesaurus_property.label',
              texts: ['<b>Republic</b> of Rafa'],
            },
          ],
        },
      },
    ]);
  });
});
