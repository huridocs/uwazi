import {db_url as dbURL} from 'api/config/database.js';
import documents from '../documents.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import queryBuilder from 'api/documents/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('documents', () => {
  let result;
  beforeEach((done) => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ]).toObject();

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('getHTML', () => {
    it('should return the html conversion of the document with documentid selector added to al css', (done) => {
      documents.getHTML('docId')
      .then((html) => {
        expect(html.css).toBe('._docId .selector1 {} ._docId .selector2 {}');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('saveHTML', () => {
    it('should save html conversion', (done) => {
      documents.saveHTML({pages: ['pages'], document: 'documentId'})
      .then(() => documents.getHTML('documentId'))
      .then((conversion) => {
        expect(conversion.pages[0]).toBe('pages');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByTemplate', () => {
    it('should return how many documents using the template passed', (done) => {
      documents.countByTemplate('template1')
      .then((count) => {
        expect(count).toBe(2);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      documents.countByTemplate('newTemplate')
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished documents for the user', (done) => {
      let user = {_id: 'c08ef2532f0bd008ac5174b45e033c94'};
      documents.getUploadsByUser(user)
      .then((response) => {
        expect(response.rows.length).toBe(1);
        expect(response.rows[0]).toEqual({title: 'unpublished', _id: 'd0298a48d1221c5ceb53c4879301508f'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('updateMetadataProperties', () => {
    let getDocumentsByTemplate = (template) => request.get(dbURL + '/_design/documents/_view/metadata_by_template?key="' + template + '"')
    .then((response) => {
      return response.json.rows.map((r) => r.value);
    });

    it('should update metadata property names on the documents matching the template', (done) => {
      let nameChanges = {property1: 'new_name1', property2: 'new_name2'};
      documents.updateMetadataProperties('template1', nameChanges)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.new_name1).toBe('value1');
        expect(docs[0].metadata.new_name2).toBe('value2');
        expect(docs[0].metadata.property3).toBe('value3');

        expect(docs[1].metadata.new_name1).toBe('value1');
        expect(docs[1].metadata.new_name2).toBe('value2');
        expect(docs[1].metadata.property3).toBe('value3');
        done();
      })
      .catch(done.fail);
    });

    it('should delete properties passed', (done) => {
      let nameChanges = {property2: 'new_name'};
      let deleteProperties = ['property1', 'property3'];
      documents.updateMetadataProperties('template1', nameChanges, deleteProperties)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.new_name).toBe('value2');
        expect(docs[0].metadata.property2).not.toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.new_name).toBe('value2');
        expect(docs[1].metadata.property2).not.toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search', () => {
    it('should perform a search on all fields', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      documents.search({searchTerm: 'searchTerm', property1: 'value1', property2: 'value2'})
      .then((results) => {
        let query = queryBuilder().fullTextSearch('searchTerm').filterMetadata({property1: 'value1', property2: 'value2'}).query();
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: query});
        expect(results).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
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
      .withHighlights([{'doc.title': ['doc1 highlighted']}, {'doc.title': ['doc2 highlighted']}])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      documents.matchTitle('term')
      .then((results) => {
        let query = queryBuilder().fullTextSearch('term', ['doc.title']).highlight(['doc.title']).limit(5).query();
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: query});
        expect(results).toEqual([{_id: 'id1', title: 'doc1 highlighted'}, {_id: 'id2', title: 'doc2 highlighted'}]);
        done();
      })
      .catch(done.fail);
    });
  });
});
