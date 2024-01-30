import { elastic } from 'api/search';
import { search } from 'api/search/search';
import date from 'api/utils/date';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import db from 'api/utils/testing_db';
import * as searchLimitsConfig from 'shared/config';
import { UserRole } from 'shared/types/userSchema';
import elasticResult from './elasticResult';
import { fixtures as elasticFixtures, ids, fixturesTimeOut } from './fixtures_elastic';

const editorUser = { _id: 'userId', role: 'editor' };

const mocks = {};

describe('search', () => {
  let result;
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    result = elasticResult().toObject();
    const elasticIndex = 'search_index_test';
    await db.setupFixturesAndContext(elasticFixtures, elasticIndex);
  }, fixturesTimeOut);

  beforeEach(async () => {
    userFactory.mockEditorUser();
  });

  afterEach(() => {
    userFactory.restore();
    Object.keys(mocks).forEach(key => {
      mocks[key].mockRestore();
      delete mocks[key];
    });
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('searchSnippets', () => {
    it('perform a search on fullText of the document passed and return the snippets', async () => {
      const snippets = await search.searchSnippets('spanish', ids.batmanFinishes, 'es');

      expect(snippets.fullText.length).toBe(1);
      expect(snippets.fullText[0].page).toBe(34);
      expect(snippets.fullText[0].text).toMatch('spanish');
      expect(snippets.fullText[0].text).not.toMatch('[[34]]');
    });

    it('perform a search on metadata and fullText and return the snippets', async () => {
      const snippets = await search.searchSnippets(
        'gargoyles',
        ids.metadataSnippets,
        'en',
        editorUser
      );

      const titleSnippet = snippets.metadata.find(snippet => snippet.field === 'title');
      const fieldSnippet = snippets.metadata.find(
        snippet => snippet.field === 'metadata.field1.value'
      );
      expect(snippets.count).toBe(3);
      expect(snippets.metadata.length).toEqual(2);
      expect(titleSnippet.texts.length).toBe(1);
      expect(titleSnippet.texts[0]).toMatch('gargoyles');
      expect(fieldSnippet.texts.length).toBe(1);
      expect(fieldSnippet.texts[0]).toMatch('gargoyles');
      expect(snippets.fullText.length).toBe(1);
    });

    it('should include unpublished documents if logged in', async () => {
      const snippets = await search.searchSnippets(
        'unpublished',
        'unpublishedSharedId',
        'en',
        editorUser
      );
      expect(snippets.fullText.length).toBe(1);
    });

    it('should not include unpublished if not logged in', async () => {
      userFactory.mock(undefined);
      const snippets = await search.searchSnippets(
        'unpublished',
        'unpublishedSharedId',
        'en',
        undefined
      );
      expect(snippets.fullText.length).toBe(0);
    });

    describe('when document is not matched', () => {
      it('should return snippet object with 0 count and empty arrays', async () => {
        userFactory.mock(undefined);
        const snippets = await search.searchSnippets(
          'not matching string',
          ids.batmanFinishes,
          'es'
        );
        expect(snippets).toEqual({
          count: 0,
          metadata: [],
          fullText: [],
        });
      });
    });

    describe('when searchTerm is empty', () => {
      it('should return empty array', async () => {
        userFactory.mock(undefined);
        const snippets = await search.searchSnippets('', ids.batmanFinishes, 'es');
        expect(snippets.fullText.length).toBe(0);
      });
    });

    it('should return a simple query string for no valid lucene syntax', async () => {
      try {
        userFactory.mock(undefined);
        await search.searchSnippets('batman OR', ids.batmanFinishes, 'es');
      } catch (e) {
        fail('should not throw an exception', e.message);
      }
    });
  });

  it('should perform a fullTextSearch on passed fields', async () => {
    userFactory.mock(undefined);
    const [resultsNotFound, resultsFound] = await Promise.all([
      search.search({ searchTerm: 'spanish', fields: ['title'] }, 'es'),
      search.search({ searchTerm: 'Batman', fields: ['title'] }, 'es'),
    ]);

    expect(resultsNotFound.rows.length).toBe(0);
    expect(resultsFound.rows.length).toBe(2);
  });

  it('should perform a fullTextSearch on fullText and title', async () => {
    userFactory.mock(undefined);
    const [
      spanish,
      none,
      english,
      batmanFinishes,
      batmanBegins,
      batmanOR,
      batman,
      fullTextNormal,
      fullTextExactMatch,
    ] = await Promise.all([
      search.search({ searchTerm: 'spanish' }, 'es'),
      search.search({ searchTerm: 'english' }, 'es'),
      search.search({ searchTerm: 'english' }, 'en'),
      search.search({ searchTerm: 'finishes' }, 'en'),
      search.search({ searchTerm: 'Batman begins NOT finishes' }, 'es'),
      search.search({ searchTerm: 'begins OR finishes' }, 'es'),
      search.search({ searchTerm: 'Batman' }, 'en'),
      search.search({ searchTerm: 'document english' }, 'en'),
      search.search({ searchTerm: '"document english"' }, 'en'),
    ]);

    expect(
      english.rows.find(r =>
        r.snippets.fullText[0].text.match('<b>english</b>\fdocument\f<b>english</b>')
      ).snippets.fullText[0].page
    ).toBe(12);
    expect(
      english.rows.find(r1 => r1.snippets.fullText[0].text.match('<b>english</b>\fanother'))
        .snippets.fullText[0].page
    ).toBe(2);
    expect(english.rows.length).toBe(2);
    expect(spanish.rows.length).toBe(1);
    expect(none.rows.length).toBe(0);
    expect(batmanFinishes.rows.length).toBe(1);
    expect(batmanBegins.rows.length).toBe(1);
    expect(batmanOR.rows.length).toBe(2);
    expect(batman.rows.length).toBe(2);
    expect(fullTextNormal.rows.length).toBe(2);
    expect(fullTextExactMatch.rows.length).toBe(1);
  });

  it('should return generatedToc aggregations when requested for', async () => {
    const response = await search.search({ aggregateGeneratedToc: true }, 'es');

    const aggregations = response.aggregations.all.generatedToc.buckets;

    expect(aggregations.find(a => a.key === 'false').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'true').filtered.doc_count).toBe(1);
  });

  it('should return aggregations when searching by 2 terms', async () => {
    userFactory.mock(undefined);
    const response = await search.search({ searchTerm: 'english document' }, 'es');
    const aggregation = response.aggregations.all._types.buckets.find(
      bucket => bucket.key === ids.template1.toString()
    );
    expect(aggregation.filtered.doc_count).toBe(1);
  });

  it('should match entities related somehow with other entities with a title that is the search term', async () => {
    userFactory.mock(undefined);
    const { rows } = await search.search({ searchTerm: 'egypt' }, 'en');

    expect(rows.length).toBe(5);
    const country = rows.find(_result => _result.sharedId === 'abc123');
    const entityWithEgypt = rows.find(_result => _result.sharedId === 'entityWithEgypt');
    const entityWithEgyptDictionary = rows.find(
      _result => _result.sharedId === 'entityWithEgyptDictionary'
    );
    expect(country).toBeDefined();
    expect(entityWithEgypt).toBeDefined();
    expect(entityWithEgyptDictionary).toBeDefined();
  });

  it('should limit the results', done => {
    userFactory.mock(undefined);
    search.search({ searchTerm: '', limit: 1, sort: 'title' }, 'en').then(({ rows }) => {
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('template1 title en');
      done();
    });
  });

  it('should return results from a given number', done => {
    userFactory.mock(undefined);
    search.search({ searchTerm: '', limit: 1, sort: 'title', from: 1 }, 'en').then(({ rows }) => {
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Something');
      done();
    });
  });

  it('should filter by templates', async () => {
    userFactory.mock(undefined);
    const [
      template1es,
      template2es,
      template1en,
      allTemplatesEn,
      onlyMissing,
      template1AndMissing,
    ] = await Promise.all([
      search.search({ types: [ids.template1] }, 'es'),
      search.search({ types: [ids.template2] }, 'es'),
      search.search({ types: [ids.template1] }, 'en'),
      search.search({ types: [ids.template1, ids.template2] }, 'en'),
      search.search({ types: ['missing'] }, 'en'),
      search.search({ types: [ids.template1, 'missing'] }, 'en'),
    ]);

    expect(template1es.rows.length).toBe(2);
    expect(template1en.rows.length).toBe(5);
    expect(template2es.rows.length).toBe(1);
    expect(allTemplatesEn.rows.length).toBe(6);
    expect(onlyMissing.rows.length).toBe(2);
    expect(template1AndMissing.rows.length).toBe(7);
  });

  it('should allow searching only within specific Ids', async () => {
    userFactory.mock(undefined);
    const [es, en, both] = await Promise.all([
      search.search({ ids: [ids.batmanBegins] }, 'es'),
      search.search({ ids: ids.batmanBegins }, 'en'),
      search.search({ ids: [ids.batmanFinishes, ids.batmanBegins] }, 'en'),
    ]);

    expect(es.rows.length).toBe(1);
    expect(es.rows[0].title).toBe('Batman begins es');
    expect(en.rows.length).toBe(1);
    expect(en.rows[0].title).toBe('Batman begins en');
    expect(both.rows.length).toBe(2);
    expect(both.rows.find(r => r.title === 'Batman finishes en')).not.toBe(null);
    expect(both.rows.find(r1 => r1.title === 'Batman begins en')).not.toBe(null);
  });

  it('should return the label with the aggregations', async () => {
    userFactory.mock(undefined);
    const response = await search.search(
      { types: [ids.templateMetadata1, ids.templateMetadata2], allAggregations: true },
      'en'
    );

    expect(response.aggregations.all.groupedDictionary.buckets.map(b => b.label)).toEqual([
      'Europe',
      'Asia',
      'No label',
      'Any',
    ]);
    expect(response.aggregations.all.groupedDictionary.buckets[0].values.map(b => b.label)).toEqual(
      ['Germany', 'Italy', 'Portugal']
    );
    expect(response.aggregations.all.groupedDictionary.buckets[1].values.map(b => b.label)).toEqual(
      ['China', 'Japan']
    );
  });

  it('should filter by metadata, and return template aggregations based on the filter the language and the published status', async () => {
    userFactory.mock(undefined);
    const joker = await search.search(
      { types: [ids.templateMetadata1, ids.templateMetadata2], filters: { field1: 'joker' } },
      'en'
    );

    const unpublished = await search.search(
      { types: [ids.templateMetadata1, ids.templateMetadata2], unpublished: true },
      'en',
      editorUser
    );
    expect(joker.rows.length).toBe(2);

    const typesAggs = joker.aggregations.all._types.buckets;
    expect(typesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(2);
    expect(typesAggs.find(a => a.key === ids.templateMetadata2)).not.toBeDefined();

    const unpublishedAggs = unpublished.aggregations.all._types.buckets;
    expect(unpublishedAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
    expect(unpublishedAggs.find(a => a.key === ids.templateMetadata2)).not.toBeDefined();
  });

  describe('filtering by metadata inheritValue', () => {
    it('should filter by select / multiselect', async () => {
      const [spain, egypt, both, bothAnd, europeInherited, europeMultiselect] = await Promise.all([
        search.search(
          { types: [ids.template1], filters: { relationshipcountry: { values: ['SpainID'] } } },
          'en'
        ),
        search.search(
          { types: [ids.template1], filters: { relationshipcountry: { values: ['EgyptID'] } } },
          'en'
        ),
        search.search(
          {
            types: [ids.template1],
            filters: { relationshipcountry: { values: ['EgyptID', 'SpainID'] } },
          },
          'en'
        ),
        search.search(
          {
            types: [ids.template1],
            filters: { relationshipcountry: { values: ['EgyptID', 'SpainID'], and: true } },
          },
          'en'
        ),
        search.search(
          {
            types: [ids.template1],
            filters: { relationshipcountry: { values: ['EuropeID'] } },
          },
          'en'
        ),
        search.search(
          {
            types: [ids.templateMetadata1],
            filters: { groupedDictionary: { values: ['EuropeID'] } },
          },
          'en'
        ),
      ]);

      expect(spain.rows.length).toBe(1);
      expect(egypt.rows.length).toBe(2);
      expect(both.rows.length).toBe(2);
      expect(bothAnd.rows.length).toBe(1);
      expect(europeInherited.rows.length).toBe(1);
      expect(europeMultiselect.rows.length).toBe(2);
    });

    it('should filter by range values', async () => {
      const [spain, egypt, both] = await Promise.all([
        search.search(
          {
            types: [ids.template1],
            filters: { relationshipdate: { from: 15, to: 25 } },
          },
          'en'
        ),
        search.search(
          { types: [ids.template1], filters: { relationshipdate: { from: 25, to: 45 } } },
          'en'
        ),
        search.search(
          { types: [ids.template1], filters: { relationshipdate: { from: 15, to: 45 } } },
          'en'
        ),
      ]);

      expect(spain.rows.length).toBe(1);
      expect(egypt.rows.length).toBe(2);
      expect(both.rows.length).toBe(2);
    });

    it('should filter by range values using descriptive timestamps', async () => {
      jest.spyOn(date, 'descriptionToTimestamp').mockImplementationOnce(value => {
        if (value === 'first-day-last-month') {
          return 15;
        }
        if (value === 'last-day-last-month') {
          return 25;
        }
        return 'not-catched';
      });

      const results = await search.search(
        {
          types: [ids.template1],
          filters: {
            relationshipdate: { from: 'first-day-last-month', to: 'last-day-last-month' },
          },
        },
        'en'
      );

      expect(results.rows[0].title).toBe('Inherited 1');
    });

    it('should filter by text values', async () => {
      const [singleMatch, multipleMatch] = await Promise.all([
        search.search(
          {
            types: [ids.template1],
            filters: { relationshiptext: 'kawans' },
          },
          'en'
        ),

        search.search(
          {
            types: [ids.template1],
            filters: { relationshiptext: 'chow' },
          },
          'en'
        ),
      ]);

      expect(singleMatch.rows.length).toBe(1);
      expect(multipleMatch.rows.length).toBe(2);
    });
  });

  it('should filter by a relationship property', async () => {
    const entities = await search.search(
      {
        types: [ids.template1],
        filters: { relationship: { values: ['shared2'] } },
      },
      'en'
    );

    expect(entities.rows.length).toBe(1);
    expect(entities.rows[0].title).toBe('Batman finishes en');
  });

  it('should filter by daterange metadata', async () => {
    let entities = await search.search(
      {
        types: [ids.templateMetadata1],
        filters: { daterange: { from: 1547997735, to: 1579533735 } },
        order: 'desc',
        sort: 'title',
      },
      'en',
      editorUser
    );

    expect(entities.rows.length).toBe(1);
    expect(entities.rows[0].title).toBe('metadata1');

    entities = await search.search(
      {
        types: [ids.templateMetadata1],
        filters: { daterange: { from: 1547997735, to: null } },
        order: 'asc',
        sort: 'title',
      },
      'en',
      editorUser
    );

    expect(entities.rows.length).toBe(2);
    expect(entities.rows[0].title).toBe('metadata1');
    expect(entities.rows[1].title).toBe('Metadata2');
  });

  it('should filter by fullText, and return template aggregations based on the filter the language and the published status', async () => {
    userFactory.mock(undefined);
    const matches = await search.search({ searchTerm: 'spanish' }, 'es');

    const matchesAggs = matches.aggregations.all._types.buckets;
    expect(matchesAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(1);
    expect(matchesAggs.find(a => a.key === ids.template2)).not.toBeDefined();
    expect(matchesAggs.find(a => a.key === ids.templateMetadata1)).not.toBeDefined();
    expect(matchesAggs.find(a => a.key === ids.templateMetadata2)).not.toBeDefined();
  });

  describe('when the query is for geolocation', () => {
    it('should set size to 9999', async () => {
      userFactory.mock(undefined);
      jest.spyOn(elastic, 'search').mockImplementationOnce(async () => Promise.resolve(result));
      await search.search({ searchTerm: '', geolocation: true }, 'en');
      const elasticQuery = elastic.search.mock.calls[0][0].body;
      expect(elasticQuery.size).toBe(9999);
    });

    it('should only get entities with geolocation fields ', async () => {
      userFactory.mock(undefined);
      const entities = await search.search({ searchTerm: '', geolocation: true }, 'en');
      expect(entities.rows.length).toBe(4);
    });

    it('should only select title and geolocation fields ', async () => {
      userFactory.mock(undefined);
      const { rows } = await search.search({ searchTerm: '', geolocation: true }, 'en');
      expect(rows[0].title).toBeDefined();
      expect(rows[0].template).toBeDefined();
      expect(rows[0].sharedId).toBeDefined();
      expect(rows[0].language).toBeDefined();
      expect(Object.keys(rows[0].metadata).length).toBe(1);
    });
  });

  describe('select aggregations', () => {
    it('should return aggregations of select fields when filtering by types', async () => {
      userFactory.mock(undefined);
      const template1 = await search.search({ types: [ids.templateMetadata1] }, 'en');
      const template2 = await search.search({ types: [ids.templateMetadata2] }, 'en');
      const both = await search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2] },
        'en'
      );
      const template1Unpublished = await search.search(
        { types: [ids.templateMetadata1], unpublished: true },
        'en',
        editorUser
      );
      const template1Aggs = template1.aggregations.all.select1.buckets;
      expect(template1Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);

      expect(template1Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
      expect(template1Aggs.find(a => a.key === 'missing')).not.toBeDefined();
      expect(template1Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(3);

      const template2Aggs = template2.aggregations.all.select1.buckets;
      expect(template2Aggs.find(a => a.key === 'EgyptID')).not.toBeDefined();
      expect(template2Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
      expect(template2Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);
      expect(template2Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(1);

      const bothAggs = both.aggregations.all.select1.buckets;
      expect(bothAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(bothAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(2);
      expect(bothAggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);
      expect(bothAggs.find(a => a.key === 'any').filtered.doc_count).toBe(4);

      const template1UnpubishedAggs = template1Unpublished.aggregations.all.select1.buckets;
      expect(template1UnpubishedAggs.find(a => a.key === 'EgyptID')).not.toBeDefined();
      expect(template1UnpubishedAggs.find(a => a.key === 'SpainID')).not.toBeDefined();
    });

    it('should limit the number of buckets', async () => {
      const defaultResult = await search.search(
        {
          types: [ids.templateMetadata1, ids.templateMetadata2],
        },
        'en'
      );
      expect(defaultResult.aggregations.all.select1.buckets.length).toBe(4);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(2);
      const limitedResult = await search.search(
        {
          types: [ids.templateMetadata1, ids.templateMetadata2],
        },
        'en'
      );
      expect(limitedResult.aggregations.all.select1.buckets.map(b => b.key)).toEqual([
        'EgyptID',
        'missing',
        'any',
      ]);
    });

    it('should limit the number of root buckets only', async () => {
      userFactory.mock(undefined);
      const defaultResponse = await search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], allAggregations: true },
        'en'
      );
      expect(defaultResponse.aggregations.all.groupedDictionary.buckets).toMatchObject([
        {
          key: 'EuropeID',
          values: [{ key: 'GermanyID' }, { key: 'ItalyID' }, { key: 'PortugalID' }],
        },
        { key: 'AsiaID', values: [{ key: 'ChinaID' }, { key: 'JapanID' }] },
        { key: 'missing' },
        { key: 'any' },
      ]);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(2);
      const limitedResponse = await search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], allAggregations: true },
        'en'
      );
      expect(limitedResponse.aggregations.all.groupedDictionary.buckets).toMatchObject([
        {
          key: 'EuropeID',
          values: [{ key: 'GermanyID' }, { key: 'ItalyID' }, { key: 'PortugalID' }],
        },
        { key: 'missing' },
        { key: 'any' },
      ]);
    });

    describe('_type aggregations', () => {
      const expectBucket = (buckets, id, count) => {
        expect(buckets.find(bucket => bucket.key === id).filtered.doc_count).toBe(count);
      };

      it('should return aggregations for all templates when filtering by template', async () => {
        const onlyPublished = await search.search({ types: [ids.templateMetadata1] }, 'en');
        const { buckets } = onlyPublished.aggregations.all._types;
        expect(onlyPublished.aggregations.all._types.count).toBe(6);
        expectBucket(buckets, ids.template, 2);
        expectBucket(buckets, ids.template1, 5);
        expectBucket(buckets, ids.template2, 1);
        expectBucket(buckets, ids.templateMetadata1, 3);
        expectBucket(buckets, ids.templateMetadata2, 2);
      });

      it('should return correct aggregations for unpublished', async () => {
        const onlyUnpublished = await search.search(
          { includeUnpublished: false, unpublished: true },
          'en',
          editorUser
        );
        expect(onlyUnpublished.aggregations.all._types.count).toBe(2);
        const { buckets } = onlyUnpublished.aggregations.all._types;
        expectBucket(buckets, ids.template, 1);
        expectBucket(buckets, ids.templateMetadata1, 1);
      });

      it('should return aggregations for include unpublished', async () => {
        const includeUnpublished = await search.search(
          { includeUnpublished: true, unpublished: false },
          'en',
          editorUser
        );
        const { buckets } = includeUnpublished.aggregations.all._types;
        expect(includeUnpublished.aggregations.all._types.count).toBe(6);
        expectBucket(buckets, ids.template, 3);
        expectBucket(buckets, ids.template1, 5);
        expectBucket(buckets, ids.template2, 1);
        expectBucket(buckets, ids.templateMetadata1, 4);
        expectBucket(buckets, ids.templateMetadata2, 2);
      });
    });
  });

  describe('inherit aggregations', () => {
    it('should return aggregations based on inheritValue', async () => {
      const allAggregations = await search.search({ allAggregations: true }, 'en');

      const template1Aggs = allAggregations.aggregations.all.relationshipcountry.buckets;
      expect(template1Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(template1Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
      const europeBucket = template1Aggs.find(a => a.key === 'EuropeID');
      expect(europeBucket.values.find(a => a.key === 'GermanyID').filtered.doc_count).toBe(1);
    });

    it('should limit the number of buckets', async () => {
      const defaultResult = await search.search({ allAggregations: true }, 'en');
      expect(defaultResult.aggregations.all.relationshipcountry.buckets.length).toBe(5);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(2);
      const limitedResult = await search.search({ allAggregations: true }, 'en');
      expect(limitedResult.aggregations.all.select1.buckets.map(b => b.key)).toEqual([
        'EgyptID',
        'missing',
        'any',
      ]);
    });
  });

  describe('relationship aggregations', () => {
    it('should return aggregations based on title of related entity', async () => {
      userFactory.mock({
        _id: ids.collaboratorId,
        role: UserRole.COLLABORATOR,
        username: 'collaboratorUser',
        email: 'collaborator@test.com',
      });
      const allAggregations = await search.search(
        { allAggregations: false, types: [ids.template1] },
        'en'
      );

      expect(allAggregations.aggregations.all.relationship.buckets).toMatchObject([
        {
          key: 'missing',
          doc_count: 29,
          filtered: {
            doc_count: 4,
          },
          label: 'No label',
        },
        {
          key: 'shared2',
          doc_count: 2,
          filtered: {
            doc_count: 1,
          },
          label: 'Batman begins en',
        },
        {
          key: 'unpublished',
          doc_count: 2,
          filtered: {
            doc_count: 1,
          },
          label: 'unpublished',
        },
        {
          key: 'any',
          doc_count: 1,
          label: 'Any',
          filtered: {
            doc_count: 1,
          },
        },
      ]);
    });

    it('should limit the number of buckets', async () => {
      userFactory.mock({
        _id: ids.collaboratorId,
        role: UserRole.COLLABORATOR,
        username: 'collaboratorUser',
        email: 'collaborator@test.com',
      });
      const defaultResult = await search.search(
        { allAggregations: false, types: [ids.template1] },
        'en'
      );
      expect(defaultResult.aggregations.all.relationship.buckets.length).toBe(4);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(2);
      const limitedResult = await search.search(
        { allAggregations: false, types: [ids.template1] },
        'en'
      );
      expect(limitedResult.aggregations.all.relationship.buckets.map(b => b.key)).toEqual([
        'shared2',
        'missing',
        'any',
      ]);
    });
  });
  describe('multiselect aggregations', () => {
    it('should return aggregations of multiselect fields', async () => {
      userFactory.mock(undefined);
      const [template1, template2, both, filtered] = await Promise.all([
        search.search({ types: [ids.templateMetadata1] }, 'en'),
        search.search({ types: [ids.templateMetadata2] }, 'en'),
        search.search({ types: [ids.templateMetadata1, ids.templateMetadata2] }, 'en'),
        search.search(
          {
            filters: {
              multiselect1: { values: ['SpainID'], and: false },
            },
            types: [ids.templateMetadata1, ids.templateMetadata2],
          },
          'en'
        ),
      ]);
      const template1Aggs = template1.aggregations.all.multiselect1.buckets;
      expect(template1Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(template1Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(2);
      expect(template1Aggs.find(a => a.key === 'missing')).not.toBeDefined();
      expect(template1Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(3);
      const template1groupedAggs = template1.aggregations.all.groupedDictionary.buckets;
      const europeBucket = template1groupedAggs.find(a => a.key === 'EuropeID');
      expect(europeBucket.values.find(a => a.key === 'GermanyID').filtered.doc_count).toBe(2);
      expect(europeBucket.values.find(a => a.key === 'franceID')).not.toBeDefined();
      const template2Aggs = template2.aggregations.all.multiselect1.buckets;
      expect(template2Aggs.find(a => a.key === 'EgyptID')).not.toBeDefined();
      expect(template2Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
      const bothAggs = both.aggregations.all.multiselect1.buckets;
      expect(bothAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(bothAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(3);
      const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
      const templateAggs = filtered.aggregations.all._types.buckets;
      expect(filteredAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(filteredAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(3);
      expect(filteredAggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);
      expect(filteredAggs.find(a => a.key === 'any').filtered.doc_count).toBe(3);
      expect(templateAggs.find(a => a.key === ids.template1)).not.toBeDefined();
      expect(templateAggs.find(a => a.key === ids.template2)).not.toBeDefined();
    });

    it('should limit the number of buckets', async () => {
      userFactory.mock(undefined);
      const defaultResult = await search.search({ types: [ids.templateMetadata1] }, 'en');
      expect(defaultResult.aggregations.all.multiselect1.buckets.length).toBe(4);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(1);
      const limitedResult = await search.search({ types: [ids.templateMetadata1] }, 'en');
      expect(limitedResult.aggregations.all.multiselect1.buckets.map(b => b.key)).toEqual([
        'EgyptID',
        'any',
      ]);
    });

    describe('allAggregations', () => {
      it('should return all aggregations', async () => {
        userFactory.mock(undefined);
        const allAggregations = await search.search(
          { allAggregations: true, includeReviewAggregations: true },
          'en'
        );
        const aggregationsIncluded = Object.keys(allAggregations.aggregations.all);
        expect(aggregationsIncluded).toMatchSnapshot();
      });
    });

    describe('AND flag', () => {
      it('should not fail when no values sent', async () => {
        userFactory.mock(undefined);
        const filtered = await search.search(
          {
            filters: { multiselect1: { and: true } },
            types: [ids.templateMetadata1, ids.templateMetadata2],
          },
          'en'
        );

        expect(filtered.totalRows).toBe(5);
      });

      it('should restrict the results to those who have all values of the filter', async () => {
        userFactory.mock(undefined);
        const filtered = await search.search(
          {
            filters: {
              multiselect1: {
                values: ['EgyptID', 'SpainID'],
                and: true,
              },
            },
            types: [ids.templateMetadata1, ids.templateMetadata2],
          },
          'en'
        );
        const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
        const templateAggs = filtered.aggregations.all._types.buckets;
        expect(filteredAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(1);
        expect(filteredAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
        expect(templateAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
      });
    });

    describe('nested', () => {
      it('should search by nested and calculate nested aggregations of fields when filtering by types', async () => {
        userFactory.mock(undefined);
        const [template2NestedAggs, nestedSearchFirstLevel] = await Promise.all([
          search.search({ types: [ids.templateMetadata2] }, 'en'),
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: { nestedField_nested: { properties: { nested1: { any: true } } } },
            },
            'en'
          ),
        ]);
        const nestedAggs = template2NestedAggs.aggregations.all.nestedField_nested.nested1.buckets;
        expect(template2NestedAggs.rows.length).toBe(2);
        expect(nestedAggs.find(a => a.key === '3').filtered.total.filtered.doc_count).toBe(1);
        expect(nestedAggs.find(a => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
        expect(nestedAggs.find(a => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
        expect(nestedAggs.find(a => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
        expect(nestedAggs.find(a => a.key === '5').filtered.total.filtered.doc_count).toBe(2);
        const bothTemplatesAggs =
          nestedSearchFirstLevel.aggregations.all.nestedField_nested.nested1.buckets;
        expect(nestedSearchFirstLevel.rows.length).toBe(3);
        expect(bothTemplatesAggs.find(a => a.key === '1').filtered.total.filtered.doc_count).toBe(
          1
        );
        expect(bothTemplatesAggs.find(a => a.key === '2').filtered.total.filtered.doc_count).toBe(
          1
        );
        expect(bothTemplatesAggs.find(a => a.key === '3').filtered.total.filtered.doc_count).toBe(
          2
        );
        expect(bothTemplatesAggs.find(a => a.key === '4').filtered.total.filtered.doc_count).toBe(
          1
        );
        expect(bothTemplatesAggs.find(a => a.key === '6').filtered.total.filtered.doc_count).toBe(
          1
        );
        expect(bothTemplatesAggs.find(a => a.key === '7').filtered.total.filtered.doc_count).toBe(
          1
        );
        expect(bothTemplatesAggs.find(a => a.key === '5').filtered.total.filtered.doc_count).toBe(
          2
        );
      });

      it('should not be affected by the bucket limitation', async () => {
        userFactory.mock(undefined);
        const defaultResponse = await search.search({ types: [ids.templateMetadata2] }, 'en');
        const defaultNestedAggregation = defaultResponse.aggregations.all.nestedField_nested;

        mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(0);
        const limitedResponse = await search.search({ types: [ids.templateMetadata2] }, 'en');
        const limitedNestedAggregation = limitedResponse.aggregations.all.nestedField_nested;

        expect(limitedNestedAggregation).toEqual(defaultNestedAggregation);
      });

      it('should search second level of nested field', async () => {
        userFactory.mock(undefined);
        const [value1, value2, value3, value35] = await Promise.all([
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField_nested: { properties: { nested1: { values: ['1'] } } },
              },
            },
            'en'
          ),
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField_nested: { properties: { nested1: { values: ['2'] } } },
              },
            },
            'en'
          ),
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField_nested: { properties: { nested1: { values: ['3'] } } },
              },
            },
            'en'
          ),
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField_nested: { properties: { nested1: { values: ['3', '5'] } } },
              },
            },
            'en'
          ),
        ]);
        expect(value1.rows.length).toBe(1);
        expect(value1.rows[0].title).toBe('metadata1');
        expect(value2.rows.length).toBe(1);
        expect(value2.rows[0].title).toBe('metadata1');
        expect(value3.rows.length).toBe(2);
        expect(value3.rows.find(r => r.title === 'metadata1')).toBeDefined();
        expect(value3.rows.find(r => r.title === ' Metadáta4')).toBeDefined();
        expect(value35.rows.length).toBe(1);
        expect(value35.rows.find(r => r.title === ' Metadáta4')).toBeDefined();
      });

      describe('strict nested filter', () => {
        it('should return only results with values selected in the same key', async () => {
          userFactory.mock(undefined);
          const [strict15, strict12] = await Promise.all([
            search.search(
              {
                types: [ids.templateMetadata1, ids.templateMetadata2],
                filters: {
                  nestedField_nested: {
                    properties: { nested1: { values: ['1', '5'] } },
                    strict: true,
                  },
                },
              },
              'en'
            ),
            search.search(
              {
                types: [ids.templateMetadata1, ids.templateMetadata2],
                filters: {
                  nestedField_nested: {
                    properties: { nested1: { values: ['1', '2'] } },
                    strict: true,
                  },
                },
              },
              'en'
            ),
          ]);
          expect(strict15.rows.length).toBe(0);
          expect(strict12.rows.length).toBe(1);
        });
      });
    });
  });

  it('should sort (ignoring case and leading whitespaces) if sort is present', async () => {
    userFactory.mock(undefined);
    const [asc, desc] = await Promise.all([
      search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], order: 'asc', sort: 'title' },
        'en'
      ),
      search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], order: 'desc', sort: 'title' },
        'en'
      ),
    ]);
    expect(asc.rows[0].title).toBe('metadata1');
    expect(asc.rows[1].title).toBe('Metadata2');
    expect(asc.rows[2].title).toBe('metádata3');
    expect(asc.rows[3].title).toBe(' Metadáta4');
    expect(desc.rows[0].title).toBe('metadata5');
    expect(desc.rows[1].title).toBe(' Metadáta4');
    expect(desc.rows[2].title).toBe('metádata3');
    expect(desc.rows[3].title).toBe('Metadata2');
  });

  it('sort by metadata values', async () => {
    userFactory.mock(undefined);
    const entities = await search.search(
      { types: [ids.templateMetadata1], order: 'desc', sort: 'metadata.date' },
      'en'
    );
    expect(entities.rows[2].title).toBe('metadata1');
    expect(entities.rows[1].title).toBe('Metadata2');
    expect(entities.rows[0].title).toBe('metádata3');
  });

  it('sort by denormalized values', async () => {
    userFactory.mock(undefined);
    const entities = await search.search(
      { types: [ids.templateMetadata1], order: 'desc', sort: 'metadata.select1' },
      'en'
    );
    expect(entities.rows[2].title).toBe('Metadata2');
    expect(entities.rows[1].title).toBe('metádata3');
    expect(entities.rows[0].title).toBe('metadata1');
  });

  it('sort by inherited values', async () => {
    userFactory.mock(undefined);
    const entitiesAsc = await search.search(
      {
        types: [ids.template1],
        order: 'asc',
        sort: 'metadata.relationshipcountryselect.inheritedValue',
      },
      'en'
    );
    expect(entitiesAsc.rows.map(entity => entity.title)).toEqual([
      'Inherited 2',
      'Inherited 1',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ]);
    const entitiesDesc = await search.search(
      {
        types: [ids.template1],
        order: 'desc',
        sort: 'metadata.relationshipcountryselect.inheritedValue',
      },
      'en'
    );
    expect(entitiesDesc.rows.map(entity => entity.title)).toEqual([
      'Inherited 1',
      'Inherited 2',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('should allow including unpublished documents if user', async () => {
    const { rows } = await search.search(
      {
        searchTerm: '',
        includeUnpublished: true,
      },
      'es',
      editorUser
    );
    expect(rows.length).toBe(6);
  });

  it('should not include unpublished documents if no user', async () => {
    userFactory.mock(undefined);
    const { rows } = await search.search(
      {
        searchTerm: '',
        includeUnpublished: true,
      },
      'es'
    );

    expect(
      rows.reduce((allArePublished, entity) => allArePublished && entity.published, true)
    ).toBe(true);
  });

  describe('autocomplete()', () => {
    it('should return a list of options matching by title', async () => {
      userFactory.mock(undefined);
      const { options } = await search.autocomplete('bat', 'en');
      expect(options.length).toBe(2);
      expect(options[0].value).toBeDefined();
      expect(options[0].template).toBeDefined();
      expect(options.find(o => o.label.includes('begins')).label).toBe('Batman begins en');
      expect(options.find(o => o.label.includes('finishes')).label).toBe('Batman finishes en');
    });

    it('should filter by template', async () => {
      userFactory.mock(undefined);
      const { options } = await search.autocomplete('en', 'en');
      expect(options.length).toBe(4);
      const { options: filteredByTemplateOptions } = await search.autocomplete('en', 'en', [
        ids.template1,
      ]);
      expect(filteredByTemplateOptions.length).toBe(3);
    });

    it('should include unpublished entities', async () => {
      const { options } = await search.autocomplete('unpublished', 'es');
      expect(options.length).toBe(1);
    });

    it('should search by the parts of a word', async () => {
      const { options } = await search.autocomplete('she', 'es');
      expect(options.length).toBe(3);

      const { options: withLongerSearch } = await search.autocomplete('shed', 'es');
      expect(withLongerSearch.length).toBe(2);
    });
  });

  describe('customFilters', () => {
    it('should filter by the values passed', async () => {
      const query = {
        customFilters: {
          generatedToc: {
            values: ['true'],
          },
        },
      };

      const { rows } = await search.search(query, 'en');
      expect(rows).toEqual([expect.objectContaining({ title: 'Batman finishes en' })]);
    });

    it('when values is empty should not filter', async () => {
      const query = {
        customFilters: {
          generatedToc: {
            values: [],
          },
        },
      };

      const { rows } = await search.search(query, 'en');
      expect(rows.length).toBe(15);
    });
  });

  describe('autocompleteAggregations()', () => {
    it('should return a list of options matching by label and options related to the matching one', async () => {
      const query = {
        types: [ids.templateMetadata1, ids.templateMetadata2],
        filters: {},
      };

      const { options, count } = await search.autocompleteAggregations(
        query,
        'en',
        'multiselect1',
        'egyp',
        editorUser
      );

      expect(options.length).toBe(1);
      expect(options[0].value).toBeDefined();
      expect(options[0].label).toBeDefined();
      expect(options[0].results).toBeDefined();
      expect(count).toBe(1);
    });

    it('should limit the options', async () => {
      const query = {
        types: [ids.templateMetadata1, ids.templateMetadata2],
        filters: {},
      };
      const defaultResponse = await search.autocompleteAggregations(
        query,
        'en',
        'multiselect1',
        'p',
        editorUser
      );
      expect(defaultResponse.options.map(o => o.label)).toEqual(['Egypt', 'Spain', 'Europe']);
      mocks.limitMock = jest.spyOn(searchLimitsConfig, 'preloadOptionsLimit').mockReturnValue(1);
      const limitedResponse = await search.autocompleteAggregations(
        query,
        'en',
        'multiselect1',
        'p',
        editorUser
      );
      expect(limitedResponse.options.map(o => o.label)).toEqual(['Egypt']);
    });
  });

  it('should return a simple query string for no valid lucene syntax', async () => {
    try {
      userFactory.mock(undefined);
      await search.search({ searchTerm: 'spanish OR', fields: ['title'] }, 'es');
    } catch (e) {
      fail('should not throw an exception', e.message);
    }
  });

  it('should search a empty search term when the asked term is the * character', async () => {
    userFactory.mock(undefined);
    const results = await search.search({ searchTerm: '*' }, 'es');
    expect(results.rows.length).toBe(4);
  });

  it('should search for generatedid properties values', async () => {
    const resultsFound = await search.search({ searchTerm: 'ABC1234' }, 'en');
    expect(resultsFound.rows.length).toBe(1);
  });

  it('should filter by generatedid property type', async () => {
    const resultsFound = await search.search(
      {
        types: [ids.templateMetadata2],
        filters: { auto_id: 'XYZ1234' },
        published: true,
      },
      'en'
    );
    expect(resultsFound.rows.length).toBe(1);
  });
});
