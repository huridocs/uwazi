/* eslint-disable max-nested-callbacks */
import {index as elasticIndex} from 'api/config/elasticIndexes';
import search from '../search.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import queryBuilder from 'api/search/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';

import fixtures, {templateId, userId} from './fixtures';
import elasticFixtures, {ids} from './fixtures_elastic';
import db from 'api/utils/testing_db';
import elasticTesting from 'api/utils/elastic_testing';
import languages from 'shared/languages';

fdescribe('search', () => {
  let result;
  beforeEach((done) => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1', snippets: {
        hits: {
          hits: [
            {
              highlight: {
                fullText: []
              }
            }
          ]
        }
      }},
      {title: 'doc2', _id: 'id2', snippets: {
        hits: {
          hits: [
            {
              highlight: {
                fullText: []
              }
            }
          ]
        }
      }},
      {title: 'doc3', _id: 'id3'},
      {title: 'doc4', _id: 'id4', snippets: {
        hits: {
          hits: []
        }
      }}
    ])
    .toObject();

    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities or documents are using the template passed', (done) => {
      search.countByTemplate(templateId)
      .then((count) => {
        expect(count).toBe(4);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      const newTemplate = db.id();
      search.countByTemplate(newTemplate)
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities or documents for the user', (done) => {
      let user = {_id: userId};
      search.getUploadsByUser(user, 'en')
      .then((response) => {
        expect(response.length).toBe(1);
        expect(response[0].title).toBe('unpublished');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('search', () => {
    beforeEach((done) => {
      db.clearAllAndLoad(elasticFixtures, (err) => {
        if (err) {
          done.fail(err);
        }

        elasticTesting.reindex()
        .then(done)
        .catch(done.fail);
      });
    });

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

    it('should perform a fullTextSearch on fullText and title', (done) => {
      Promise.all([
        search.search({searchTerm: 'spanish'}, 'es'),
        search.search({searchTerm: 'english'}, 'es'),
        search.search({searchTerm: 'english'}, 'en'),
        search.search({searchTerm: 'Batman finishes'}, 'en'),
        search.search({searchTerm: 'Batman begins'}, 'es'),
        search.search({searchTerm: 'Batman'}, 'en')
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

    it('should filter by templates', (done) => {
      Promise.all([
        search.search({types: [ids.template1]}, 'es'),
        search.search({types: [ids.template2]}, 'es'),
        search.search({types: [ids.template1]}, 'en'),
        search.search({types: [ids.template1, ids.template2]}, 'en'),
        search.search({types: ['missing']}, 'en'),
        search.search({types: [ids.template1, 'missing']}, 'en')
      ])
      .then(([template1es, template2es, template1en, allTemplatesEn, onlyMissing, template1AndMissing]) => {
        expect(template1es.rows.length).toBe(2);
        expect(template1en.rows.length).toBe(2);
        expect(template2es.rows.length).toBe(1);
        expect(allTemplatesEn.rows.length).toBe(3);
        expect(onlyMissing.rows.length).toBe(1);
        expect(template1AndMissing.rows.length).toBe(3);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow searching only within specific Ids', (done) => {
      Promise.all([
        search.search({ids: [ids.batmanBegins]}, 'es'),
        search.search({ids: ids.batmanBegins}, 'en'),
        search.search({ids: [ids.batmanFinishes, ids.batmanBegins]}, 'en')
      ])
      .then(([es, en, both]) => {
        expect(es.rows.length).toBe(1);
        expect(es.rows[0].title).toBe('Batman begins es');
        expect(en.rows.length).toBe(1);
        expect(en.rows[0].title).toBe('Batman begins en');
        expect(both.rows.length).toBe(2);
        expect(both.rows.find((r) => r.title === 'Batman finishes en')).not.toBe(null);
        expect(both.rows.find((r) => r.title === 'Batman begins en')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by metadata, and return template aggregations based on the filter the language and the published status', (done) => {
      Promise.all([
        search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {field1: 'joker'}}, 'en'),
        search.search({types: [ids.templateMetadata1, ids.templateMetadata2], unpublished: true}, 'en', {_id: 'user'})
      ])
      .then(([joker, unpublished]) => {
        expect(joker.rows.length).toBe(2);

        const typesAggs = joker.aggregations.all.types.buckets;
        expect(typesAggs.find((a) => a.key === ids.templateMetadata1).filtered.doc_count).toBe(2);
        expect(typesAggs.find((a) => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);

        const unpublishedAggs = unpublished.aggregations.all.types.buckets;
        expect(unpublishedAggs.find((a) => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);
        expect(unpublishedAggs.find((a) => a.key === ids.templateMetadata2).filtered.doc_count).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('select aggregations', () => {
      it('should return aggregations of select fields when filtering by types', (done) => {
        Promise.all([
          search.search({types: [ids.templateMetadata1]}, 'en'),
          search.search({types: [ids.templateMetadata2]}, 'en'),
          search.search({types: [ids.templateMetadata1, ids.templateMetadata2]}, 'en'),
          search.search({types: [ids.templateMetadata1], unpublished: true}, 'en', {_id: 'user'})
        ])
        .then(([template1, template2, both, template1Unpublished]) => {
          const template1Aggs = template1.aggregations.all.select1.buckets;
          expect(template1Aggs.find((a) => a.key === 'selectValue1').filtered.doc_count).toBe(2);
          expect(template1Aggs.find((a) => a.key === 'selectValue2').filtered.doc_count).toBe(1);

          const template2Aggs = template2.aggregations.all.select1.buckets;
          expect(template2Aggs.find((a) => a.key === 'selectValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find((a) => a.key === 'selectValue2').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.select1.buckets;
          expect(bothAggs.find((a) => a.key === 'selectValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find((a) => a.key === 'selectValue2').filtered.doc_count).toBe(2);

          const template1UnpubishedAggs = template1Unpublished.aggregations.all.select1.buckets;
          expect(template1UnpubishedAggs.find((a) => a.key === 'selectValue1').filtered.doc_count).toBe(0);
          expect(template1UnpubishedAggs.find((a) => a.key === 'selectValue2').filtered.doc_count).toBe(0);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('multiselect aggregations', () => {
      it('should return aggregations of multiselect fields', (done) => {
        Promise.all([
          search.search({types: [ids.templateMetadata1]}, 'en'),
          search.search({types: [ids.templateMetadata2]}, 'en'),
          search.search({types: [ids.templateMetadata1, ids.templateMetadata2]}, 'en'),
          search.search({filters: {multiselect1: {values: ['multiValue2'], and: false}}, types: [ids.templateMetadata1, ids.templateMetadata2]}, 'en')
        ])
        .then(([template1, template2, both, filtered]) => {
          const template1Aggs = template1.aggregations.all.multiselect1.buckets;
          expect(template1Aggs.find((a) => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(template1Aggs.find((a) => a.key === 'multiValue2').filtered.doc_count).toBe(2);

          const template2Aggs = template2.aggregations.all.multiselect1.buckets;
          expect(template2Aggs.find((a) => a.key === 'multiValue1').filtered.doc_count).toBe(0);
          expect(template2Aggs.find((a) => a.key === 'multiValue2').filtered.doc_count).toBe(1);

          const bothAggs = both.aggregations.all.multiselect1.buckets;
          expect(bothAggs.find((a) => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(bothAggs.find((a) => a.key === 'multiValue2').filtered.doc_count).toBe(3);

          const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
          const templateAggs = filtered.aggregations.all.types.buckets;
          expect(filteredAggs.find((a) => a.key === 'multiValue1').filtered.doc_count).toBe(2);
          expect(filteredAggs.find((a) => a.key === 'multiValue2').filtered.doc_count).toBe(3);
          expect(templateAggs.find((a) => a.key === ids.template1).filtered.doc_count).toBe(0);
          expect(templateAggs.find((a) => a.key === ids.template2).filtered.doc_count).toBe(0);

          done();
        })
        .catch(catchErrors(done));
      });

      describe('AND falg', () => {
        it('should restrict the results to those who have all values of the filter', (done) => {
          search.search(
            {
              filters: {multiselect1: {values: ['multiValue1', 'multiValue2'], and: true}},
              types: [ids.templateMetadata1, ids.templateMetadata2]
            }, 'en')
          .then((filtered) => {
            const filteredAggs = filtered.aggregations.all.multiselect1.buckets;
            const templateAggs = filtered.aggregations.all.types.buckets;
            expect(filteredAggs.find((a) => a.key === 'multiValue1').filtered.doc_count).toBe(1);
            expect(filteredAggs.find((a) => a.key === 'multiValue2').filtered.doc_count).toBe(1);
            expect(templateAggs.find((a) => a.key === ids.templateMetadata1).filtered.doc_count).toBe(1);

            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('nested', () => {
        it('should search by nested and calculate nested aggregations of fields when filtering by types', (done) => {
          Promise.all([
            search.search({types: [ids.templateMetadata2]}, 'en'),
            search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {nestedField: {properties: {nested1: {any: true}}}}}, 'en')
          ])
          .then(([template2NestedAggs, nestedSearchFirstLevel]) => {
            const nestedAggs = template2NestedAggs.aggregations.all.nestedField.nested1.buckets;
            expect(template2NestedAggs.rows.length).toBe(2);
            expect(nestedAggs.find((a) => a.key === '3').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find((a) => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find((a) => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find((a) => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
            expect(nestedAggs.find((a) => a.key === '5').filtered.total.filtered.doc_count).toBe(2);

            const bothTemplatesAggs = nestedSearchFirstLevel.aggregations.all.nestedField.nested1.buckets;
            expect(nestedSearchFirstLevel.rows.length).toBe(3);
            expect(bothTemplatesAggs.find((a) => a.key === '1').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find((a) => a.key === '2').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find((a) => a.key === '3').filtered.total.filtered.doc_count).toBe(2);
            expect(bothTemplatesAggs.find((a) => a.key === '4').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find((a) => a.key === '6').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find((a) => a.key === '7').filtered.total.filtered.doc_count).toBe(1);
            expect(bothTemplatesAggs.find((a) => a.key === '5').filtered.total.filtered.doc_count).toBe(2);
            done();
          })
          .catch(catchErrors(done));
        });

        it('should search second level of nested field', (done) => {
          Promise.all([
            search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
              nestedField: {properties: {nested1: {values: ['1']}}}
            }}, 'en'),
            search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
              nestedField: {properties: {nested1: {values: ['2']}}}
            }}, 'en'),
            search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
              nestedField: {properties: {nested1: {values: ['3']}}}
            }}, 'en'),
            search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
              nestedField: {properties: {nested1: {values: ['3', '5']}}}
            }}, 'en')
          ])
          .then(([value1, value2, value3, value35]) => {
            expect(value1.rows.length).toBe(1);
            expect(value1.rows[0].title).toBe('metadata1');

            expect(value2.rows.length).toBe(1);
            expect(value2.rows[0].title).toBe('metadata1');

            expect(value3.rows.length).toBe(2);
            expect(value3.rows.find((r) => r.title === 'metadata1')).toBeDefined();
            expect(value3.rows.find((r) => r.title === ' Metadáta4')).toBeDefined();

            expect(value35.rows.length).toBe(1);
            expect(value35.rows.find((r) => r.title === ' Metadáta4')).toBeDefined();

            done();
          })
          .catch(catchErrors(done));
        });

        describe('strict nested filter', () => {
          it('should return only results with values selected in the same key', (done) => {
            Promise.all([
              search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
                nestedField: {properties: {nested1: {values: ['1', '5']}}, strict: true}
              }}, 'en'),
              search.search({types: [ids.templateMetadata1, ids.templateMetadata2], filters: {
                nestedField: {properties: {nested1: {values: ['1', '2']}}, strict: true}
              }}, 'en')
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
        search.search({types: [ids.templateMetadata1, ids.templateMetadata2], order: 'asc', sort: 'title'}, 'en'),
        search.search({types: [ids.templateMetadata1, ids.templateMetadata2], order: 'desc', sort: 'title'}, 'en')
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

    it('should allow including unpublished documents', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        includeUnpublished: true
      }, 'es')
      .then(() => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .includeUnpublished()
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: elasticIndex, body: expectedQuery});
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
      it('should index the fullText as child', (done) => {
        spyOn(elastic, 'index').and.returnValue(Promise.resolve());
        spyOn(languages, 'detect').and.returnValue('english');

        const entity = {
          _id: 'asd1',
          type: 'document',
          title: 'Batman indexes',
          file: {fullText: 'text'}
        };

        search.index(entity)
        .then(() => {
          expect(elastic.index)
          .toHaveBeenCalledWith({index: elasticIndex, type: 'entity', id: 'asd1', body: {type: 'document', title: 'Batman indexes', file: {}}});
          expect(elastic.index)
          .toHaveBeenCalledWith({index: elasticIndex, type: 'fullText', parent: 'asd1', body: {fullText_english: 'text'}});
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('bulkIndex', () => {
    it('should update docs using the bulk functionality', (done) => {
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve());
      const toIndexDocs = [
        {_id: 'id1', title: 'test1', pdfInfo: 'Should not be included'},
        {_id: 'id2', title: 'test2', pdfInfo: 'Should not be included'}
      ];

      search.bulkIndex(toIndexDocs)
      .then(() => {
        expect(elastic.bulk).toHaveBeenCalledWith({body: [
          {index: {_index: elasticIndex, _type: 'entity', _id: 'id1'}},
          {title: 'test1'},
          {index: {_index: elasticIndex, _type: 'entity', _id: 'id2'}},
          {title: 'test2'}
        ]});
        done();
      });
    });

    describe('when docs have fullText', () => {
      it('should be indexed separatedly as a child of the doc', (done) => {
        spyOn(elastic, 'bulk').and.returnValue(Promise.resolve());
        spyOn(languages, 'detect').and.returnValue('english');
        const toIndexDocs = [
          {_id: 'id1', title: 'test1', file: {fullText: 'text1'}},
          {_id: 'id2', title: 'test2', file: {fullText: 'text2'}}
        ];

        search.bulkIndex(toIndexDocs, 'index')
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({body: [
            {index: {_index: elasticIndex, _type: 'entity', _id: 'id1'}},
            {title: 'test1', file: {}},
            {index: {_index: elasticIndex, _type: 'fullText', parent: 'id1'}},
            {fullText_english: 'text1'},
            {index: {_index: elasticIndex, _type: 'entity', _id: 'id2'}},
            {title: 'test2', file: {}},
            {index: {_index: elasticIndex, _type: 'fullText', parent: 'id2'}},
            {fullText_english: 'text2'}
          ]});
          done();
        });
      });
    });
  });

  describe('indexEntities', () => {
    it('should index entities based on query params passed', (done) => {
      spyOn(search, 'bulkIndex');
      search.indexEntities({sharedId: 'shared'}, {title: 1})
      .then(() => {
        const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
        expect(documentsToIndex[0].title).toBeDefined();
        expect(documentsToIndex[0].metadata).not.toBeDefined();
        expect(documentsToIndex[1].title).toBeDefined();
        expect(documentsToIndex[1].metadata).not.toBeDefined();
        expect(documentsToIndex[2].title).toBeDefined();
        expect(documentsToIndex[2].metadata).not.toBeDefined();
        done();
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
        .toHaveBeenCalledWith({index: elasticIndex, type: 'entity', id: id.toString()});
        done();
      })
      .catch(done.fail);
    });
  });
});
