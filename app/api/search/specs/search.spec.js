import {index as elasticIndex} from 'api/config/elasticIndexes';
import search from '../search.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import queryBuilder from 'api/search/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';
import templatesModel from '../../templates';

import fixtures, {templateId, userId} from './fixtures';
import elasticFixtures, {batmanFinishes, batmanBegins} from './fixtures_elastic';
import db from 'api/utils/testing_db';
import elasticTesting from 'api/utils/elastic_testing';

describe('search', () => {
  let result;
  beforeEach((done) => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1', snippets: {
        hits: {
          hits: [
            {
              highlight: {
                fullText: 'snippets'
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
                fullText: 'snippets2'
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

  xdescribe('countByTemplate', () => {
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

  xdescribe('getUploadsByUser', () => {
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

  xdescribe('searchSnippets', () => {
    it('perform a search on fullText of the document passed and return the snippets', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.searchSnippets('searchTerm', 'id', 'es')
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm', [], true, 9999)
        .filterById('id')
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: elasticIndex, body: expectedQuery});
        expect(results.rows[0]).toEqual({_id: 'id1', title: 'doc1', snippets: 'snippets'});
        done();
      });
    });
  });

  fdescribe('search', () => {
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

    fit('should perform a fullTextSearch on fullText and title', (done) => {
      Promise.all([
        search.search({searchTerm: 'spanish'}, 'es'),
        search.search({searchTerm: 'english'}, 'es'),
        search.search({searchTerm: 'english'}, 'en'),
        search.search({searchTerm: 'Batman finishes'}, 'en'),
        search.search({searchTerm: 'Batman begins'}, 'es'),
        search.search({searchTerm: 'Batman'}, 'en')
      ])
      .then(([spanish, none, english, batmanFinishes, batmanBegins, batman]) => {
        expect(spanish.rows.length).toBe(1);
        expect(none.rows.length).toBe(0);
        expect(english.rows.length).toBe(1);
        expect(batmanFinishes.rows.length).toBe(1);
        expect(batmanBegins.rows.length).toBe(1);
        expect(batman.rows.length).toBe(2);
        done();
      });
    });

    fit('should filter by templates', (done) => {
      Promise.all([
        search.search({types: ['template1']}, 'es'),
        search.search({types: ['template2']}, 'es'),
        search.search({types: ['template1']}, 'en'),
        search.search({types: ['template1', 'template2']}, 'en')
      ])
      .then(([template1es, template2es, template1en, allTemplatesEn]) => {
        expect(template1es.rows.length).toBe(2);
        expect(template1en.rows.length).toBe(2);
        expect(template2es.rows.length).toBe(1);
        expect(allTemplatesEn.rows.length).toBe(3);
        done();
      });
    });

    fit('should allow searching only within specific Ids', (done) => {
      Promise.all([
        search.search({ids: [batmanBegins]}, 'es'),
        search.search({ids: batmanBegins}, 'en'),
        search.search({ids: [batmanFinishes, batmanBegins]}, 'en')
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
      });
    });

    fit('should filter by metadata, and return template aggregations', (done) => {
      Promise.all([
        search.search({filters: {field1: {value: 'joker', type: 'text'}}}, 'en')
      ])
      .then(([joker]) => {
        console.log(JSON.stringify(joker, null, ' '));
        expect(joker.rows.length).toBe(2);
        done();
      });
    });

    it('should sort if sort is present', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        filters: {property1: 'value1', property2: 'value2'},
        sort: 'title',
        order: 'asc',
        types: ['ruling']
      }, 'es')
      .then(() => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .filterByTemplate(['ruling'])
        .filterMetadata({
          property1: { value: 'value1', type: 'text' },
          property2: { value: 'value2', type: 'text' }
        })
        .aggregations([])
        .language('es')
        .sort('title', 'asc')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: elasticIndex, body: expectedQuery});
        done();
      });
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

  describe('matchTitle', () => {
    it('should perform a search by title with highlighted titles', (done) => {
      result = elasticResult().withDocs([
        {title: 'doc1', _id: 'id1'},
        {title: 'doc2', _id: 'id2'}
      ])
      .withHighlights([{title: ['doc1 highlighted']}, {title: ['doc2 highlighted']}])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      search.matchTitle('term', 'es')
      .then((results) => {
        let query = queryBuilder().fullTextSearch('term', ['title'], false).highlight(['title']).language('es').limit(5).query();
        expect(elastic.search).toHaveBeenCalledWith({index: elasticIndex, body: query});
        expect(results).toEqual([{_id: 'id1', title: 'doc1 highlighted'}, {_id: 'id2', title: 'doc2 highlighted'}]);
        done();
      })
      .catch(done.fail);
    });

    it('should return empty array if searchTerm is empty and not an error', (done) => {
      result = elasticResult().withDocs([
        {title: 'doc1', _id: 'id1'},
        {title: 'doc2', _id: 'id2'}
      ])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      search.matchTitle('', 'es')
      .then((results) => {
        expect(results).toEqual([]);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('index', () => {
    it('should index the document', (done) => {
      spyOn(elastic, 'index').and.returnValue(Promise.resolve());

      const entity = {
        _id: 'asd1',
        type: 'document',
        title: 'Batman indexes'
      };

      search.index(entity)
      .then(() => {
        expect(elastic.index)
        .toHaveBeenCalledWith({index: elasticIndex, type: 'entity', id: 'asd1', body: {
          type: 'document',
          title: 'Batman indexes'
        }});
        done();
      })
      .catch(done.fail);
    });

    describe('when document has fullText', () => {
      it('should index the fullText as child', (done) => {
        spyOn(elastic, 'index').and.returnValue(Promise.resolve());

        const entity = {
          _id: 'asd1',
          type: 'document',
          title: 'Batman indexes',
          fullText: 'text'
        };

        search.index(entity)
        .then(() => {
          expect(elastic.index)
          .toHaveBeenCalledWith({index: elasticIndex, type: 'entity', id: 'asd1', body: {
            type: 'document',
            title: 'Batman indexes'
          }});
          expect(elastic.index)
          .toHaveBeenCalledWith({index: elasticIndex, type: 'fullText', parent: 'asd1', body: {
            fullText: 'text'
          }});
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
        {_id: 'id1', title: 'test1'},
        {_id: 'id2', title: 'test2'}
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
        const toIndexDocs = [
          {_id: 'id1', title: 'test1', fullText: 'text1'},
          {_id: 'id2', title: 'test2', fullText: 'text2'}
        ];

        search.bulkIndex(toIndexDocs, 'index')
        .then(() => {
          expect(elastic.bulk).toHaveBeenCalledWith({body: [
            {index: {_index: elasticIndex, _type: 'entity', _id: 'id1'}},
            {title: 'test1'},
            {index: {_index: elasticIndex, _type: 'fullText', parent: 'id1'}},
            {fullText: 'text1'},
            {index: {_index: elasticIndex, _type: 'entity', _id: 'id2'}},
            {title: 'test2'},
            {index: {_index: elasticIndex, _type: 'fullText', parent: 'id2'}},
            {fullText: 'text2'}
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
