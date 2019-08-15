/* eslint-disable max-nested-callbacks */
import elasticIndexes from 'api/config/elasticIndexes';
import { search, documentQueryBuilder, elastic } from 'api/search';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import elasticResult from './elasticResult';
import elasticFixtures, { ids } from './fixtures_elastic';

describe('search', () => {
  let result;
  const elasticTesting = instanceElasticTesting('search_index_test');

  beforeAll(async () => {
    result = elasticResult().withDocs(
    [
      { title: 'doc1',
        _id: 'id1',
        snippets: {
          hits: {
            hits: [
              {
                highlight: {
                  fullText: []
                }
              }
            ]
          }
        }
      }
    ])
    .toObject();

    await db.clearAllAndLoad(elasticFixtures);
    await elasticTesting.reindex();
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities or documents for the user', async () => {
      const user = { _id: ids.userId };
      const response = await search.getUploadsByUser(user, 'en');

      expect(response.length).toBe(1);
      expect(response[0].title).toBe('metadata6');
    });
  });

  describe('search', () => {
    describe('searchSnippets', () => {
      it('perform a search on fullText of the document passed and return the snippets', (done) => {
        search.searchSnippets('spanish', ids.batmanFinishes, 'es')
        .then((snippets) => {
          expect(snippets.fullText.length).toBe(1);
          expect(snippets.fullText[0].page).toBe(34);
          expect(snippets.fullText[0].text).toMatch('spanish');
          expect(snippets.fullText[0].text).not.toMatch('[[34]]');
          done();
        })
        .catch(catchErrors(done));
      });

      it('perform a search on metadata and fullText and return the snippets', (done) => {
        search.searchSnippets('gargoyles', ids.metadataSnippets, 'en')
        .then((snippets) => {
          const titleSnippet = snippets.metadata.find(snippet => snippet.field === 'title');
          const fieldSnippet = snippets.metadata.find(snippet => snippet.field === 'metadata.field1');
          expect(snippets.count).toBe(3);
          expect(snippets.metadata.length).toBe(2);
          expect(titleSnippet.texts.length).toBe(1);
          expect(titleSnippet.texts[0]).toMatch('gargoyles');
          expect(fieldSnippet.texts.length).toBe(1);
          expect(fieldSnippet.texts[0]).toMatch('gargoyles');
          expect(snippets.fullText.length).toBe(1);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should perform the search on unpublished documents also', (done) => {
        search.searchSnippets('unpublished', 'unpublishedSharedId', 'en')
        .then((snippets) => {
          expect(snippets.fullText.length).toBe(1);
          done();
        })
        .catch(catchErrors(done));
      });

      describe('when document is not matched', () => {
        it('should return snippet object with 0 count and empty arrays', (done) => {
          search.searchSnippets('not matching string', ids.batmanFinishes, 'es')
          .then((snippets) => {
            expect(snippets).toEqual({
              count: 0,
              metadata: [],
              fullText: []
            });
            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('when searchTerm is empty', () => {
        it('should return empty array', (done) => {
          search.searchSnippets('', ids.batmanFinishes, 'es')
          .then((snippets) => {
            expect(snippets.fullText.length).toBe(0);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    it('should perform a fullTextSearch on passed fields', (done) => {
      Promise.all([
        search.search({ searchTerm: 'spanish', fields: ['title'] }, 'es'),
        search.search({ searchTerm: 'Batman', fields: ['title'] }, 'es')
      ])
      .then(([resultsNotFound, resultsFound]) => {
        expect(resultsNotFound.rows.length).toBe(0);
        expect(resultsFound.rows.length).toBe(2);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should perform a fullTextSearch on fullText and title', (done) => {
      Promise.all([
        search.search({ searchTerm: 'spanish' }, 'es'),
        search.search({ searchTerm: 'english' }, 'es'),
        search.search({ searchTerm: 'english' }, 'en'),
        search.search({ searchTerm: 'finishes' }, 'en'),
        search.search({ searchTerm: 'Batman begins NOT finishes' }, 'es'),
        search.search({ searchTerm: 'begins OR finishes' }, 'es'),
        search.search({ searchTerm: 'Batman' }, 'en'),
        search.search({ searchTerm: 'document english' }, 'en'),
        search.search({ searchTerm: '"document english"' }, 'en')
      ])
      .then(([spanish, none, english, batmanFinishes, batmanBegins, batmanOR, batman, fullTextNormal, fullTextExactMatch]) => {
        expect(english.rows.find(r => r.snippets.fullText[0].text.match('<b>english</b>\fdocument\f<b>english</b>')).snippets.fullText[0].page)
        .toBe(12);
        expect(english.rows.find(r => r.snippets.fullText[0].text.match('<b>english</b>\fanother')).snippets.fullText[0].page).toBe(2);
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
      })
      .catch(catchErrors(done));
    });

    it('should return aggregations when searching by 2 terms', (done) => {
      search.search({ searchTerm: 'english document' }, 'es')
      .then((response) => {
        const aggregation = response.aggregations.all._types.buckets.find(bucket => bucket.key === ids.template1.toString());
        expect(aggregation.filtered.doc_count).toBe(1);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should convert aggregation buckets that are objects to arrays', (done) => {
      result.aggregations.all = {
        dictionaryWithGroups: {
          buckets: {
            a: { doc_count: 2, filtered: { doc_count: 1 } },
            b: { doc_count: 2, filtered: { doc_count: 1 } }
          }
        }
      };
      spyOn(elastic, 'search').and.returnValue(Promise.resolve(result));
      search.search({ searchTerm: '', geolocation: true }, 'en')
      .then((response) => {
        const expectedBuckets = [{ key: 'a', doc_count: 2, filtered: { doc_count: 1 } }, { key: 'b', doc_count: 2, filtered: { doc_count: 1 } }];
        expect(response.aggregations.all.dictionaryWithGroups.buckets).toEqual(expectedBuckets);
        done();
      });
    });

    it('should match entities related somehow with other entities with a title that is the search term', (done) => {
      search.search({ searchTerm: 'egypt' }, 'en')
      .then(({ rows }) => {
        expect(rows.length).toBe(3);
        const country = rows.find(_result => _result.sharedId === 'abc123');
        const entityWithEgypt = rows.find(_result => _result.sharedId === 'entityWithEgypt');
        const entityWithEgyptDictionary = rows.find(_result => _result.sharedId === 'entityWithEgyptDictionary');
        expect(country).toBeDefined();
        expect(entityWithEgypt).toBeDefined();
        expect(entityWithEgyptDictionary).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should limit the results', (done) => {
      search.search({ searchTerm: '', limit: 1, sort: 'title' }, 'en')
      .then(({ rows }) => {
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe('template1 title en');
        done();
      });
    });

    it('should return results from a given number', (done) => {
      search.search({ searchTerm: '', limit: 1, sort: 'title', from: 1 }, 'en')
      .then(({ rows }) => {
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe('Something');
        done();
      });
    });

    it('should filter by templates', (done) => {
      Promise.all([
        search.search({ types: [ids.template1] }, 'es'),
        search.search({ types: [ids.template2] }, 'es'),
        search.search({ types: [ids.template1] }, 'en'),
        search.search({ types: [ids.template1, ids.template2] }, 'en'),
        search.search({ types: ['missing'] }, 'en'),
        search.search({ types: [ids.template1, 'missing'] }, 'en')
      ])
      .then(([template1es, template2es, template1en, allTemplatesEn, onlyMissing, template1AndMissing]) => {
        expect(template1es.rows.length).toBe(2);
        expect(template1en.rows.length).toBe(3);
        expect(template2es.rows.length).toBe(1);
        expect(allTemplatesEn.rows.length).toBe(4);
        expect(onlyMissing.rows.length).toBe(2);
        expect(template1AndMissing.rows.length).toBe(5);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow searching only within specific Ids', (done) => {
      Promise.all([
        search.search({ ids: [ids.batmanBegins] }, 'es'),
        search.search({ ids: ids.batmanBegins }, 'en'),
        search.search({ ids: [ids.batmanFinishes, ids.batmanBegins] }, 'en')
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

    it('should filter by metadata, and return template aggregations based on the filter the language and the published status', (done) => {
      Promise.all([
        search.search({ types: [ids.templateMetadata1, ids.templateMetadata2], filters: { field1: 'joker' } }, 'en'),
        search.search({ types: [ids.templateMetadata1, ids.templateMetadata2], unpublished: true }, 'en', { _id: 'user' })
      ])
      .then(([joker, unpublished]) => {
        expect(joker.rows.length).toBe(2);

        const typesAggs = joker.aggregations.all._types.buckets;
        expect(typesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(2);
        expect(typesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);

        const unpublishedAggs = unpublished.aggregations.all._types.buckets;
        expect(unpublishedAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
        expect(unpublishedAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by relationships metadata selects', async () => {
      const response = await search.search({
        types: [ids.template1],
        filters: { status_relationship_filter: { status: { values: ['open'] } } }
      }, 'en');
      expect(response.rows.length).toBe(2);
      const matchesAggs = response.aggregations.all.status;
      const openValueAggregation = matchesAggs.buckets[0].filtered.doc_count;
      const closedValueAggregation = matchesAggs.buckets[1].filtered.doc_count;
      expect(openValueAggregation).toBe(2);
      expect(closedValueAggregation).toBe(1);
    });

    it('should filter by relationships metadata text', async () => {
      const response = await search.search({
        types: [ids.template1],
        filters: { status_relationship_filter: { description: 'red' } }
      }, 'en');
      expect(response.rows.length).toBe(2);
    });

    it('should filter by relationships metadata markdown', async () => {
      const response = await search.search({
        types: [ids.templateMetadata1],
        filters: { rich_text: 'rich' }
      }, 'en');
      expect(response.rows.length).toBe(1);
    });

    it('should filter by fullText, and return template aggregations based on the filter the language and the published status', (done) => {
      Promise.all([
        search.search({ searchTerm: 'spanish' }, 'es')
      ])
      .then(([matches]) => {
        const matchesAggs = matches.aggregations.all._types.buckets;
        expect(matchesAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(1);
        expect(matchesAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);
        expect(matchesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(0);
        expect(matchesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the query is for geolocation', () => {
      it('should set size to 9999', (done) => {
        spyOn(elastic, 'search').and.returnValue(Promise.resolve(result));
        search.search({ searchTerm: '', geolocation: true }, 'en')
        .then(() => {
          const elasticQuery = elastic.search.calls.argsFor(0)[0].body;
          expect(elasticQuery.size).toBe(9999);
          done();
        });
      });

      it('should only get entities with geolocation fields ', (done) => {
        search.search({ searchTerm: '', geolocation: true }, 'en')
        .then((entities) => {
          expect(entities.rows.length).toBe(3);
          done();
        });
      });

      it('should only select title and geolocation fields ', (done) => {
        search.search({ searchTerm: '', geolocation: true }, 'en')
        .then(({ rows }) => {
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
      it('should return aggregations of select fields when filtering by types', (done) => {
        Promise.all([
          search.search({ types: [ids.templateMetadata1] }, 'en'),
          search.search({ types: [ids.templateMetadata2] }, 'en'),
          search.search({ types: [ids.templateMetadata1, ids.templateMetadata2] }, 'en'),
          search.search({ types: [ids.templateMetadata1], unpublished: true }, 'en', { _id: 'user' })
        ])
        .then(([template1, template2, both, template1Unpublished]) => {
          const template1Aggs = template1.aggregations.all.select1.buckets;
          expect(template1Aggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(2);
          expect(template1Aggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(1);
          expect(template1Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(0);

          const template2Aggs = template2.aggregations.all.select1.buckets;
          expect(template2Aggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(1);
          expect(template2Aggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.select1.buckets;
          expect(bothAggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(2);
          expect(bothAggs.find(a => a.key === 'missing').filtered.doc_count).toBe(1);

          const template1UnpubishedAggs = template1Unpublished.aggregations.all.select1.buckets;
          expect(template1UnpubishedAggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(0);
          expect(template1UnpubishedAggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(0);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('multiselect aggregations', () => {
      it('should return aggregations of multiselect fields', (done) => {
        Promise.all([
          search.search({ types: [ids.templateMetadata1] }, 'en'),
          search.search({ types: [ids.templateMetadata2] }, 'en'),
          search.search({ types: [ids.templateMetadata1, ids.templateMetadata2] }, 'en'),
          search.search({ filters: { multiselect1: { values: ['multiValue2'], and: false } },
            types: [ids.templateMetadata1, ids.templateMetadata2] }, 'en')
        ])
        .then(([template1, template2, both, filtered]) => {
          const template1Aggs = template1.aggregations.all.multiselect1.buckets;
          expect(template1Aggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(template1Aggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(2);

          const template1groupedAggs = template1.aggregations.all.groupedDictionary.buckets;
          expect(template1groupedAggs.find(a => a.key === 'spainID').filtered.doc_count).toBe(2);
          expect(template1groupedAggs.find(a => a.key === 'franceID').filtered.doc_count).toBe(0);

          const template2Aggs = template2.aggregations.all.multiselect1.buckets;
          expect(template2Aggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.multiselect1.buckets;
          expect(bothAggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(3);

          const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
          const templateAggs = filtered.aggregations.all._types.buckets;
          expect(filteredAggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(filteredAggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(3);
          expect(templateAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(0);
          expect(templateAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);

          done();
        })
        .catch(catchErrors(done));
      });

      describe('allAggregations', () => {
        it('should return all aggregations', async () => {
          const allAggregations = await search.search({ allAggregations: true }, 'en');
          const aggregationsIncluded = (Object.keys(allAggregations.aggregations.all));
          expect(aggregationsIncluded).toMatchSnapshot();
        });
      });

      describe('AND flag', () => {
        it('should not fail when no values sent', async () => {
          const filtered = await search.search({
            filters: { multiselect1: { and: true } },
            types: [ids.templateMetadata1, ids.templateMetadata2]
          }, 'en');

          expect(filtered.totalRows).toBe(5);
        });

        it('should restrict the results to those who have all values of the filter', (done) => {
          search.search(
            {
              filters: { multiselect1: { values: ['multiValue1', 'multiValue2'], and: true } },
              types: [ids.templateMetadata1, ids.templateMetadata2]
            }, 'en')
          .then((filtered) => {
            const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
            const templateAggs = filtered.aggregations.all._types.buckets;
            expect(filteredAggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(1);
            expect(filteredAggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(1);
            expect(templateAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);

            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('nested', () => {
        it('should search by nested and calculate nested aggregations of fields when filtering by types', (done) => {
          Promise.all([
            search.search({ types: [ids.templateMetadata2] }, 'en'),
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: { nestedField: { properties: { nested1: { any: true } } } } }, 'en')
          ])
          .then(([template2NestedAggs, nestedSearchFirstLevel]) => {
            const nestedAggs = template2NestedAggs.aggregations.all.nestedField.nested1.buckets;
            expect(template2NestedAggs.rows.length).toBe(2);
            expect(nestedAggs.find(a => a.key === '3').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find(a => a.key === '5').filtered.total.filtered.doc_count).toBe(2);

            const bothTemplatesAggs = nestedSearchFirstLevel.aggregations.all.nestedField.nested1.buckets;
            expect(nestedSearchFirstLevel.rows.length).toBe(3);
            expect(bothTemplatesAggs.find(a => a.key === '1').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find(a => a.key === '2').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find(a => a.key === '3').filtered.total.filtered.doc_count).toBe(2);
            expect(bothTemplatesAggs.find(a => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find(a => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find(a => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find(a => a.key === '5').filtered.total.filtered.doc_count).toBe(2);
            done();
          })
          .catch(catchErrors(done));
        });

        it('should search second level of nested field', (done) => {
          Promise.all([
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField: { properties: { nested1: { values: ['1'] } } }
              } }, 'en'),
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField: { properties: { nested1: { values: ['2'] } } }
              } }, 'en'),
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField: { properties: { nested1: { values: ['3'] } } }
              } }, 'en'),
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
              filters: {
                nestedField: { properties: { nested1: { values: ['3', '5'] } } }
              } }, 'en')
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
          it('should return only results with values selected in the same key', (done) => {
            Promise.all([
              search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
                filters: {
                  nestedField: { properties: { nested1: { values: ['1', '5'] } }, strict: true }
                } }, 'en'),
              search.search({ types: [ids.templateMetadata1, ids.templateMetadata2],
                filters: {
                  nestedField: { properties: { nested1: { values: ['1', '2'] } }, strict: true }
                } }, 'en')
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

    it('should sort (ignoring case and leading whitespaces) if sort is present', (done) => {
      Promise.all([
        search.search({ types: [ids.templateMetadata1, ids.templateMetadata2], order: 'asc', sort: 'title' }, 'en'),
        search.search({ types: [ids.templateMetadata1, ids.templateMetadata2], order: 'desc', sort: 'title' }, 'en')
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

    it('should allow including unpublished documents if user', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise(resolve => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        includeUnpublished: true
      }, 'es', 'user')
      .then(() => {
        const expectedQuery = documentQueryBuilder()
        .fullTextSearch('searchTerm', ['metadata.field1', 'metadata.field2', 'metadata.rich_text', 'metadata.field3', 'title', 'fullText'], 2)
        .includeUnpublished()
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({ index: elasticIndexes.index, body: expectedQuery });
        done();
      });
    });

    it('should not include unpublished documents if no user', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise(resolve => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        includeUnpublished: true
      }, 'es')
      .then(() => {
        const expectedQuery = documentQueryBuilder()
        .fullTextSearch('searchTerm', ['metadata.field1', 'metadata.field2', 'metadata.rich_text', 'metadata.field3', 'title', 'fullText'], 2)
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({ index: elasticIndexes.index, body: expectedQuery });
        done();
      });
    });
  });
});
