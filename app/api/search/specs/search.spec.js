/* eslint-disable max-nested-callbacks, max-lines */
import { elastic } from 'api/search';
import { search } from 'api/search/search';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import db from 'api/utils/testing_db';
import elasticResult from './elasticResult';
import { fixtures as elasticFixtures, ids, fixturesTimeOut } from './fixtures_elastic';
import { permissionsLevelFixtures, user1, group1, group2 } from './permissionsLevelFixtures';

const editorUser = { _id: 'userId', role: 'editor' };

describe('search', () => {
  let result;
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    result = elasticResult().toObject();
    const elasticIndex = 'search_index_test';
    await db.setupFixturesAndContext(elasticFixtures, elasticIndex);
    userFactory.restore();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
    userFactory.restore();
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
      it('should return snippet object with 0 count and empty arrays', done => {
        userFactory.mock(undefined);
        search
          .searchSnippets('not matching string', ids.batmanFinishes, 'es')
          .then(snippets => {
            expect(snippets).toEqual({
              count: 0,
              metadata: [],
              fullText: [],
            });
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when searchTerm is empty', () => {
      it('should return empty array', done => {
        userFactory.mock(undefined);
        search
          .searchSnippets('', ids.batmanFinishes, 'es')
          .then(snippets => {
            expect(snippets.fullText.length).toBe(0);
            done();
          })
          .catch(catchErrors(done));
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

  it('should perform a fullTextSearch on fullText and title', done => {
    userFactory.mock(undefined);
    Promise.all([
      search.search({ searchTerm: 'spanish' }, 'es'),
      search.search({ searchTerm: 'english' }, 'es'),
      search.search({ searchTerm: 'english' }, 'en'),
      search.search({ searchTerm: 'finishes' }, 'en'),
      search.search({ searchTerm: 'Batman begins NOT finishes' }, 'es'),
      search.search({ searchTerm: 'begins OR finishes' }, 'es'),
      search.search({ searchTerm: 'Batman' }, 'en'),
      search.search({ searchTerm: 'document english' }, 'en'),
      search.search({ searchTerm: '"document english"' }, 'en'),
    ])
      .then(
        ([
          spanish,
          none,
          english,
          batmanFinishes,
          batmanBegins,
          batmanOR,
          batman,
          fullTextNormal,
          fullTextExactMatch,
        ]) => {
          expect(
            english.rows.find(r =>
              r.snippets.fullText[0].text.match('<b>english</b>\fdocument\f<b>english</b>')
            ).snippets.fullText[0].page
          ).toBe(12);
          expect(
            english.rows.find(r => r.snippets.fullText[0].text.match('<b>english</b>\fanother'))
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
          done();
        }
      )
      .catch(catchErrors(done));
  });

  it('should return generatedToc aggregations when requested for', async () => {
    const response = await search.search({ aggregateGeneratedToc: true }, 'es');

    const aggregations = response.aggregations.all.generatedToc.buckets;

    expect(aggregations.find(a => a.key === 'false').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'true').filtered.doc_count).toBe(1);
  });

  /* XXX */
  fit('should return aggregations of permission level filtered per current user', async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionslevelfixtures');
    userFactory.mock({ _id: 'User2' });

    let response = await search.search({ permissionsByLevel: true }, 'es');
    let aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(1);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(0);

    userFactory.mock({ _id: 'User1' });
    response = await search.search({ permissionsByLevel: true }, 'es');
    aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(1);
  });

  fit('should return aggregations of permission level filtered per current users group', async () => {
    await db.setupFixturesAndContext(permissionsLevelFixtures, 'permissionslevelfixtures');
    userFactory.mock({ _id: user1, groups: [{ _id: group1 }, { _id: group2 }] });

    let response = await search.search({ permissionsByLevel: true }, 'es');
    let aggregations = response.aggregations.all.permissions.buckets;
    expect(aggregations.find(a => a.key === 'read').filtered.doc_count).toBe(2);
    expect(aggregations.find(a => a.key === 'write').filtered.doc_count).toBe(2);
  });
  /* XXX */

  it('should return aggregations when searching by 2 terms', done => {
    userFactory.mock(undefined);
    search
      .search({ searchTerm: 'english document' }, 'es')
      .then(response => {
        const aggregation = response.aggregations.all._types.buckets.find(
          bucket => bucket.key === ids.template1.toString()
        );
        expect(aggregation.filtered.doc_count).toBe(1);
        done();
      })
      .catch(catchErrors(done));
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

  it('should filter by templates', done => {
    userFactory.mock(undefined);
    Promise.all([
      search.search({ types: [ids.template1] }, 'es'),
      search.search({ types: [ids.template2] }, 'es'),
      search.search({ types: [ids.template1] }, 'en'),
      search.search({ types: [ids.template1, ids.template2] }, 'en'),
      search.search({ types: ['missing'] }, 'en'),
      search.search({ types: [ids.template1, 'missing'] }, 'en'),
    ])
      .then(
        ([
          template1es,
          template2es,
          template1en,
          allTemplatesEn,
          onlyMissing,
          template1AndMissing,
        ]) => {
          expect(template1es.rows.length).toBe(2);
          expect(template1en.rows.length).toBe(3);
          expect(template2es.rows.length).toBe(1);
          expect(allTemplatesEn.rows.length).toBe(4);
          expect(onlyMissing.rows.length).toBe(2);
          expect(template1AndMissing.rows.length).toBe(5);
          done();
        }
      )
      .catch(catchErrors(done));
  });

  it('should allow searching only within specific Ids', done => {
    userFactory.mock(undefined);
    Promise.all([
      search.search({ ids: [ids.batmanBegins] }, 'es'),
      search.search({ ids: ids.batmanBegins }, 'en'),
      search.search({ ids: [ids.batmanFinishes, ids.batmanBegins] }, 'en'),
    ])
      .then(([es, en, both]) => {
        expect(es.rows.length).toBe(1);
        expect(es.rows[0].title).toBe('Batman begins es');
        expect(en.rows.length).toBe(1);
        expect(en.rows[0].title).toBe('Batman begins en');
        expect(both.rows.length).toBe(2);
        expect(both.rows.find(r => r.title === 'Batman finishes en')).not.toBe(null);
        expect(both.rows.find(r => r.title === 'Batman begins en')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
  });

  it('should return the label with the aggregations', async () => {
    userFactory.mock(undefined);
    const response = await search.search(
      { types: [ids.templateMetadata1, ids.templateMetadata2], allAggregations: true },
      'en'
    );

    expect(response.aggregations.all.groupedDictionary.buckets[0].label).toBe('Egypt');
    expect(response.aggregations.all.groupedDictionary.buckets[1].label).toBe('Chile');
    expect(response.aggregations.all.groupedDictionary.buckets[2].label).toBe('Spain');
    expect(response.aggregations.all.groupedDictionary.buckets[3].label).toBe('Europe');
    expect(response.aggregations.all.groupedDictionary.buckets[3].values[0].label).toBe('Germany');
    expect(response.aggregations.all.groupedDictionary.buckets[3].values[1].label).toBe('France');
    expect(response.aggregations.all.groupedDictionary.buckets[4].label).toBe('No label');
    expect(response.aggregations.all.groupedDictionary.buckets[5].label).toBe('Any');
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
    expect(typesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);

    const unpublishedAggs = unpublished.aggregations.all._types.buckets;
    expect(unpublishedAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
    expect(unpublishedAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
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
    expect(matchesAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);
    expect(matchesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(0);
    expect(matchesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
  });

  describe('when the query is for geolocation', () => {
    it('should set size to 9999', done => {
      userFactory.mock(undefined);
      spyOn(elastic, 'search').and.returnValue(Promise.resolve(result));
      search.search({ searchTerm: '', geolocation: true }, 'en').then(() => {
        const elasticQuery = elastic.search.calls.argsFor(0)[0].body;
        expect(elasticQuery.size).toBe(9999);
        done();
      });
    });

    it('should only get entities with geolocation fields ', done => {
      userFactory.mock(undefined);
      search.search({ searchTerm: '', geolocation: true }, 'en').then(entities => {
        expect(entities.rows.length).toBe(3);
        done();
      });
    });

    it('should only select title and geolocation fields ', done => {
      userFactory.mock(undefined);
      search.search({ searchTerm: '', geolocation: true }, 'en').then(({ rows }) => {
        expect(rows[0].title).toBeDefined();
        expect(rows[0].template).toBeDefined();
        expect(rows[0].sharedId).toBeDefined();
        expect(rows[0].language).toBeDefined();
        expect(Object.keys(rows[0].metadata).length).toBe(1);
        done();
      });
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
      expect(template1Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(0);
      expect(template1Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(3);

      const template2Aggs = template2.aggregations.all.select1.buckets;
      expect(template2Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(0);
      expect(template2Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
      expect(template2Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);
      expect(template2Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(1);

      const bothAggs = both.aggregations.all.select1.buckets;
      expect(bothAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
      expect(bothAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(2);
      expect(bothAggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);
      expect(bothAggs.find(a => a.key === 'any').filtered.doc_count).toBe(4);

      const template1UnpubishedAggs = template1Unpublished.aggregations.all.select1.buckets;
      expect(template1UnpubishedAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(0);
      expect(template1UnpubishedAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(0);
    });
  });

  describe('multiselect aggregations', () => {
    it('should return aggregations of multiselect fields', done => {
      userFactory.mock(undefined);
      Promise.all([
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
      ])
        .then(([template1, template2, both, filtered]) => {
          const template1Aggs = template1.aggregations.all.multiselect1.buckets;
          expect(template1Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(2);
          expect(template1Aggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(2);
          expect(template1Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(0);
          expect(template1Aggs.find(a => a.key === 'any').filtered.doc_count).toBe(3);

          const template1groupedAggs = template1.aggregations.all.groupedDictionary.buckets;
          const europeBucket = template1groupedAggs.find(a => a.key === 'EuropeID');
          expect(europeBucket.values.find(a => a.key === 'GermanyID').filtered.doc_count).toBe(2);
          expect(europeBucket.values.find(a => a.key === 'franceID').filtered.doc_count).toBe(0);

          const template2Aggs = template2.aggregations.all.multiselect1.buckets;
          expect(template2Aggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(0);
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
          expect(templateAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(0);
          expect(templateAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);

          done();
        })
        .catch(catchErrors(done));
    });

    describe('allAggregations', () => {
      it('should return all aggregations', async () => {
        userFactory.mock(undefined);
        const allAggregations = await search.search({ allAggregations: true }, 'en');
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

      it('should restrict the results to those who have all values of the filter', done => {
        userFactory.mock(undefined);
        search
          .search(
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
          )
          .then(filtered => {
            const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
            const templateAggs = filtered.aggregations.all._types.buckets;
            expect(filteredAggs.find(a => a.key === 'EgyptID').filtered.doc_count).toBe(1);
            expect(filteredAggs.find(a => a.key === 'SpainID').filtered.doc_count).toBe(1);
            expect(templateAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(
              1
            );

            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('nested', () => {
      it('should search by nested and calculate nested aggregations of fields when filtering by types', done => {
        userFactory.mock(undefined);
        Promise.all([
          search.search({ types: [ids.templateMetadata2] }, 'en'),
          search.search(
            {
              types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: { nestedField_nested: { properties: { nested1: { any: true } } } },
            },
            'en'
          ),
        ])
          .then(([template2NestedAggs, nestedSearchFirstLevel]) => {
            const nestedAggs =
              template2NestedAggs.aggregations.all.nestedField_nested.nested1.buckets;

            expect(template2NestedAggs.rows.length).toBe(2);
            expect(nestedAggs.find(a => a.key === '3').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '5').filtered.total.filtered.doc_count).toBe(2);

            const bothTemplatesAggs =
              nestedSearchFirstLevel.aggregations.all.nestedField_nested.nested1.buckets;
            expect(nestedSearchFirstLevel.rows.length).toBe(3);
            expect(
              bothTemplatesAggs.find(a => a.key === '1').filtered.total.filtered.doc_count
            ).toBe(1);
            expect(
              bothTemplatesAggs.find(a => a.key === '2').filtered.total.filtered.doc_count
            ).toBe(1);
            expect(
              bothTemplatesAggs.find(a => a.key === '3').filtered.total.filtered.doc_count
            ).toBe(2);
            expect(
              bothTemplatesAggs.find(a => a.key === '4').filtered.total.filtered.doc_count
            ).toBe(1);
            expect(
              bothTemplatesAggs.find(a => a.key === '6').filtered.total.filtered.doc_count
            ).toBe(1);
            expect(
              bothTemplatesAggs.find(a => a.key === '7').filtered.total.filtered.doc_count
            ).toBe(1);
            expect(
              bothTemplatesAggs.find(a => a.key === '5').filtered.total.filtered.doc_count
            ).toBe(2);
            done();
          })
          .catch(catchErrors(done));
      });

      it('should search second level of nested field', done => {
        userFactory.mock(undefined);
        Promise.all([
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
        ])
          .then(([value1, value2, value3, value35]) => {
            expect(value1.rows.length).toBe(1);
            expect(value1.rows[0].title).toBe('metadata1');

            expect(value2.rows.length).toBe(1);
            expect(value2.rows[0].title).toBe('metadata1');

            expect(value3.rows.length).toBe(2);
            expect(value3.rows.find(r => r.title === 'metadata1')).toBeDefined();
            expect(value3.rows.find(r => r.title === ' Metadáta4')).toBeDefined();

            expect(value35.rows.length).toBe(1);
            expect(value35.rows.find(r => r.title === ' Metadáta4')).toBeDefined();

            done();
          })
          .catch(catchErrors(done));
      });

      describe('strict nested filter', () => {
        it('should return only results with values selected in the same key', done => {
          userFactory.mock(undefined);
          Promise.all([
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
          ])
            .then(([strict15, strict12]) => {
              expect(strict15.rows.length).toBe(0);
              expect(strict12.rows.length).toBe(1);
              done();
            })
            .catch(catchErrors(done));
        });
      });
    });
  });

  it('should sort (ignoring case and leading whitespaces) if sort is present', done => {
    userFactory.mock(undefined);
    Promise.all([
      search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], order: 'asc', sort: 'title' },
        'en'
      ),
      search.search(
        { types: [ids.templateMetadata1, ids.templateMetadata2], order: 'desc', sort: 'title' },
        'en'
      ),
    ])
      .then(([asc, desc]) => {
        expect(asc.rows[0].title).toBe('metadata1');
        expect(asc.rows[1].title).toBe('Metadata2');
        expect(asc.rows[2].title).toBe('metádata3');
        expect(asc.rows[3].title).toBe(' Metadáta4');

        expect(desc.rows[0].title).toBe('metadata5');
        expect(desc.rows[1].title).toBe(' Metadáta4');
        expect(desc.rows[2].title).toBe('metádata3');
        expect(desc.rows[3].title).toBe('Metadata2');
        done();
      })
      .catch(catchErrors(done));
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

  it('should allow including unpublished documents if user', async () => {
    const { rows } = await search.search(
      {
        searchTerm: '',
        includeUnpublished: true,
      },
      'es',
      editorUser
    );
    expect(rows.length).toBe(5);
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

    it('should filter by unpublished', async () => {
      userFactory.mock(undefined);
      const { options } = await search.autocomplete('unpublished', 'es');
      expect(options.length).toBe(0);
      const { options: optionsUnpublished } = await search.autocomplete(
        'unpublished',
        'es',
        [],
        true
      );
      expect(optionsUnpublished.length).toBe(1);
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
});
