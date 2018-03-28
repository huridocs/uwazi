/* eslint-disable max-nested-callbacks */
import { index as elasticIndex } from 'api/config/elasticIndexes';
import mongoose from 'mongoose';
import { search, documentQueryBuilder, elastic } from 'api/search';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import languages from 'shared/languages';
import elasticResult from './elasticResult';
import elasticFixtures, { ids } from './fixtures_elastic';

describe('search', () => {
  let result;
  const elasticTesting = instanceElasticTesting('search_index_test');

  beforeAll((done) => {
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

    db.clearAllAndLoad(elasticFixtures)
    .then(() => mongoose.model('entities').collection.createIndex({ title: 'text' }))
    .then(() => elasticTesting.reindex())
    .then(done)
    .catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities or documents for the user', (done) => {
      const user = { _id: ids.userId };
      search.getUploadsByUser(user, 'en')
      .then((response) => {
        expect(response.length).toBe(1);
        expect(response[0].title).toBe('metadata6');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('search', () => {
    describe('searchSnippets', () => {
      it('perform a search on fullText of the document passed and return the snippets', (done) => {
        search.searchSnippets('spanish', ids.batmanFinishes, 'es')
        .then((snippets) => {
          expect(snippets.length).toBe(1);
          expect(snippets[0].page).toBe(34);
          expect(snippets[0].text).toMatch('spanish');
          expect(snippets[0].text).not.toMatch('[[34]]');
          done();
        })
        .catch(catchErrors(done));
      });

      it('should perform the search on unpublished documents also', (done) => {
        search.searchSnippets('unpublished', 'unpublishedSharedId', 'en')
        .then((snippets) => {
          expect(snippets.length).toBe(1);
          done();
        })
        .catch(catchErrors(done));
      });

      describe('when document is not matched', () => {
        it('should return empty array', (done) => {
          search.searchSnippets('not matching string', ids.batmanFinishes, 'es')
          .then((snippets) => {
            expect(snippets.length).toBe(0);
            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('when searchTerm is empty', () => {
        it('should return empty array', (done) => {
          search.searchSnippets('', ids.batmanFinishes, 'es')
          .then((snippets) => {
            expect(snippets.length).toBe(0);
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
        search.search({ searchTerm: 'Batman finishes' }, 'en'),
        search.search({ searchTerm: 'Batman begins' }, 'es'),
        search.search({ searchTerm: 'Batman' }, 'en')
      ])
      .then(([spanish, none, english, batmanFinishes, batmanBegins, batman]) => {
        expect(english.rows.find(r => r.snippets[0].text.match('<b>english</b> document <b>english</b>')).snippets[0].page).toBe(12);
        expect(english.rows.find(r => r.snippets[0].text.match('<b>english</b> another')).snippets[0].page).toBe(2);
        expect(english.rows.length).toBe(2);

        expect(spanish.rows.length).toBe(1);
        expect(none.rows.length).toBe(0);
        expect(batmanFinishes.rows.length).toBe(1);
        expect(batmanBegins.rows.length).toBe(1);
        expect(batman.rows.length).toBe(2);
        done();
      })
      .catch(catchErrors(done));
    });

    fit('should return aggregations when searching by 2 terms', (done) => {
      search.search({ searchTerm: 'english document' }, 'es')
      .then((response) => {
        console.log(response.rows.length);
        const aggregation = response.aggregations.all.types.buckets.find(bucket => bucket.key === ids.template1.toString());
        expect(aggregation.filtered.doc_count).toBe(1);
        done();
      })
      .catch(catchErrors(done));
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
        expect(template1en.rows.length).toBe(2);
        expect(template2es.rows.length).toBe(1);
        expect(allTemplatesEn.rows.length).toBe(3);
        expect(onlyMissing.rows.length).toBe(2);
        expect(template1AndMissing.rows.length).toBe(4);
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

        const typesAggs = joker.aggregations.all.types.buckets;
        expect(typesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(2);
        expect(typesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);

        const unpublishedAggs = unpublished.aggregations.all.types.buckets;
        expect(unpublishedAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
        expect(unpublishedAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by fullText, and return template aggregations based on the filter the language and the published status', (done) => {
      Promise.all([
        search.search({ searchTerm: 'spanish' }, 'es')
      ])
      .then(([matches]) => {
        const matchesAggs = matches.aggregations.all.types.buckets;
        expect(matchesAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(1);
        expect(matchesAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);
        expect(matchesAggs.find(a => a.key === ids.templateMetadata1).filtered.doc_count).toBe(0);
        expect(matchesAggs.find(a => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
        done();
      })
      .catch(catchErrors(done));
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

          const template2Aggs = template2.aggregations.all.select1.buckets;
          expect(template2Aggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.select1.buckets;
          expect(bothAggs.find(a => a.key === 'selectValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find(a => a.key === 'selectValue2').filtered.doc_count).toBe(2);

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
          search.search({ filters: { multiselect1: { values: ['multiValue2'], and: false } }, types: [ids.templateMetadata1, ids.templateMetadata2] }, 'en')
        ])
        .then(([template1, template2, both, filtered]) => {
          const template1Aggs = template1.aggregations.all.multiselect1.buckets;
          expect(template1Aggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(template1Aggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(2);

          const template2Aggs = template2.aggregations.all.multiselect1.buckets;
          expect(template2Aggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.multiselect1.buckets;
          expect(bothAggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(3);

          const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
          const templateAggs = filtered.aggregations.all.types.buckets;
          expect(filteredAggs.find(a => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(filteredAggs.find(a => a.key === 'multiValue2').filtered.doc_count).toBe(3);
          expect(templateAggs.find(a => a.key === ids.template1).filtered.doc_count).toBe(0);
          expect(templateAggs.find(a => a.key === ids.template2).filtered.doc_count).toBe(0);

          done();
        })
        .catch(catchErrors(done));
      });

      describe('AND falg', () => {
        it('should restrict the results to those who have all values of the filter', (done) => {
          search.search(
            {
              filters: { multiselect1: { values: ['multiValue1', 'multiValue2'], and: true } },
              types: [ids.templateMetadata1, ids.templateMetadata2]
            }, 'en')
          .then((filtered) => {
            const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
            const templateAggs = filtered.aggregations.all.types.buckets;
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
            search.search({ types: [ids.templateMetadata1, ids.templateMetadata2], filters: { nestedField: { properties: { nested1: { any: true } } } } }, 'en')
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
        .fullTextSearch('searchTerm', ['metadata.field1', 'metadata.field2', 'metadata.field3', 'title', 'fullText'], 2)
        .includeUnpublished()
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({ index: elasticIndex, body: expectedQuery });
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
        .fullTextSearch('searchTerm', ['metadata.field1', 'metadata.field2', 'metadata.field3', 'title', 'fullText'], 2)
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({ index: elasticIndex, body: expectedQuery });
        done();
      });
    });
  });

  describe('index', () => {
    it('should index the document (omitting pdfInfo), without side effects on the sent element', (done) => {
      spyOn(elastic, 'index').and.returnValue(Promise.resolve());

      const entity = {
        _id: 'asd1',
        type: 'document',
        title: 'Batman indexes',
        pdfInfo: 'Should not be included'
      };

      search.index(entity)
      .then(() => {
        expect(entity._id).toBe('asd1');
        expect(elastic.index)
        .toHaveBeenCalledWith({
          index: elasticIndex,
          type: 'entity',
          id: 'asd1',
          body: {
            type: 'document',
            title: 'Batman indexes'
          }
        });
        done();
      })
      .catch(done.fail);
    });

    describe('when document has fullText', () => {
      it('should index the fullText as child with proper language', (done) => {
        spyOn(elastic, 'index').and.returnValue(Promise.resolve());
        spyOn(languages, 'detect').and.returnValue('english');

        const entity = {
          _id: 'asd1',
          type: 'document',
          title: 'Batman indexes',
          fullText: 'text'
        };

        search.index(entity)
        .then(() => {
          expect(elastic.index)
          .toHaveBeenCalledWith({ index: elasticIndex, type: 'entity', id: 'asd1', body: { type: 'document', title: 'Batman indexes' } });
          expect(elastic.index)
          .toHaveBeenCalledWith({ index: elasticIndex, type: 'fullText', parent: 'asd1', body: { fullText_english: 'text' }, id: 'asd1_fullText' });
          done();
        })
        .catch(done.fail);
      });

      describe('when language is not supported (korean in this case)', () => {
        it('should index the fullText as child as "other" language (so searches can be performed)', (done) => {
          const entity = {
            _id: db.id(),
            sharedId: 'sharedIdOtherLanguage',
            type: 'document',
            title: 'Batman indexes',
            fullText: '조 선말',
            language: 'en'
          };

          search.index(entity)
          .then(() => elasticTesting.refresh())
          .then(() => search.searchSnippets('조', entity.sharedId, 'en'))
          .then((snippets) => {
            expect(snippets.length).toBe(1);
            return search.searchSnippets('nothing', entity.sharedId, 'en');
          })
          .then((snippets) => {
            expect(snippets.length).toBe(0);
            done();
          })
          .catch((e) => {
            console.log(e);
            done.fail(e);
          });
        });
      });
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', (done) => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
      const toIndexDocs = [
        { _id: 'id1', title: 'test1', pdfInfo: 'Should not be included' },
        { _id: 'id2', title: 'test2', pdfInfo: 'Should not be included' }
      ];

      search.bulkIndex(toIndexDocs)
      .then(() => {
        expect(elastic.bulk).toHaveBeenCalledWith({ body: [
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
          { title: 'test1' },
          { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
          { title: 'test2' }
        ] });
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', (done) => {
        spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ items: [] }));
        spyOn(languages, 'detect').and.returnValue('english');
        const toIndexDocs = [
          { _id: 'id1', title: 'test1', fullText: 'text1' },
          { _id: 'id2', title: 'test2', fullText: 'text2' }
        ];

        search.bulkIndex(toIndexDocs, 'index')
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({ body: [
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id1' } },
            { title: 'test1' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id1', _id: 'id1_fullText' } },
            { fullText_english: 'text1' },
            { index: { _index: elasticIndex, _type: 'entity', _id: 'id2' } },
            { title: 'test2' },
            { index: { _index: elasticIndex, _type: 'fullText', parent: 'id2', _id: 'id2_fullText' } },
            { fullText_english: 'text2' }
          ] });
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('delete', () => {
    it('should delete the index', (done) => {
      spyOn(elastic, 'delete').and.returnValue(Promise.resolve());

      const id = db.id();

      const entity = {
        _id: id,
        type: 'document',
        title: 'Batman indexes'
      };

      search.delete(entity)
      .then(() => {
        expect(elastic.delete)
        .toHaveBeenCalledWith({ index: elasticIndex, type: 'entity', id: id.toString() });
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
