import {db_url as dbURL} from 'api/config/database.js';
import documents from '../documents.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import queryBuilder from 'api/documents/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import fs from 'fs';
import {mockID} from 'shared/uniqueID';
import references from 'api/references';

describe('documents', () => {
  let result;
  beforeEach((done) => {
    spyOn(references, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    mockID();
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ]).toObject();

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(catchErrors(done));
  });

  describe('get', () => {
    it('should return a list of documents returned from the list view', (done) => {
      documents.get()
      .then((response) => {
        expect(response.rows.length).toBe(7);
        expect(response.rows[0].title).toEqual('Batman finishes');
        expect(response.rows[0]._id).toEqual('8202c463d6158af8065022d9b5014a18');
        done();
      })
      .catch(console.log);
    });
    describe('when passing id', () => {
      it('should return matching document', (done) => {
        let docId = '8202c463d6158af8065022d9b5014ccb';

        documents.get(docId)
        .then((response) => {
          let docs = response.rows;
          expect(docs.length).toBe(1);
          expect(docs[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save', () => {
    let getDocuments = () => request.get(dbURL + '/_design/documents/_view/all').then((response) => response.json.rows.map(r => r.value));
    let getDocument = (id = '8202c463d6158af8065022d9b5014ccb') => request.get(dbURL + `/${id}`).then((response) => response.json);

    it('should create a new document with logged user id and UTC date', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      documents.save(doc, user)
      .then(getDocuments)
      .then((docs) => {
        let createdDocument = docs.find((d) => d.title === 'Batman begins');
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user).toEqual(user);
        expect(createdDocument.creationDate).toEqual('universal time');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should saveEntityBasedReferences', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      documents.save(doc, user)
      .then(() => {
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._rev).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should assign unique ids to toc entries', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins', toc: [{}, {_id: '1'}]};
      let user = {_id: 'user Id'};

      documents.save(doc, user)
      .then(getDocuments)
      .then((docs) => {
        let createdDocument = docs.find((d) => d.title === 'Batman begins');
        expect(createdDocument.toc[0]._id).toBe('unique_id');
        expect(createdDocument.toc[1]._id).toBe('1');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: 'user Id'};

      documents.save(doc, user)
      .then((createdDocument) => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument._rev).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user).toEqual(user);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', (done) => {
        spyOn(date, 'currentUTC').and.returnValue('another_date');
        getDocument()
        .then((doc) => {
          let modifiedDoc = {_id: doc._id, _rev: doc._rev};
          return documents.save(modifiedDoc, 'another_user');
        })
        .then(getDocuments)
        .then((docs) => {
          let modifiedDoc = docs.find((d) => d.title === 'Penguin almost done');
          expect(modifiedDoc.user).not.toBe('another_user');
          expect(modifiedDoc.creationDate).not.toBe('another_date');
          done();
        })
        .catch(catchErrors(done));
      });

      it('should be able to partially update it', (done) => {
        getDocument()
        .then((doc) => {
          let modifiedDoc = {_id: doc._id, _rev: doc._rev, test: 'test'};
          return documents.save(modifiedDoc);
        })
        .then(getDocuments)
        .then((docs) => {
          let modifiedDoc = docs.find((d) => d.title === 'Penguin almost done');
          expect(modifiedDoc.test).toBe('test');
          done();
        })
        .catch(catchErrors(done));
      });
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
        expect(response.rows[0].title).toBe('unpublished');
        expect(response.rows[0]._id).toBe('d0298a48d1221c5ceb53c4879301508f');
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
      documents.search({
        searchTerm: 'searchTerm',
        filters: {property1: 'value1', property2: 'value2'},
        fields: ['field'],
        types: ['ruling']
      })
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm', ['field'])
        .filterMetadata({property1: 'value1', property2: 'value2'})
        .filterByTemplate(['ruling'])
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: expectedQuery});
        expect(results.rows).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        expect(results.totalRows).toEqual(10);
        done();
      });
    });

    it('should sort if sort is present', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      documents.search({
        searchTerm: 'searchTerm',
        filters: {property1: 'value1', property2: 'value2'},
        sort: 'title',
        order: 'asc',
        types: ['ruling']
      })
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .filterMetadata({property1: 'value1', property2: 'value2'})
        .filterByTemplate(['ruling'])
        .sort('title', 'asc').query();

        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: expectedQuery});
        expect(results.rows).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
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

  describe('list', () => {
    it('should return a list of documents with the title', (done) => {
      documents.list()
      .then((results) => {
        expect(results.rows.length).toBe(7);
        expect(results.rows[0].title).toBe('Batman finishes');
        done();
      })
      .catch(done.fail);
    });

    describe('when giving a list of keys', () => {
      it('should return only those documents', (done) => {
        documents.list(['8202c463d6158af8065022d9b5014ccb', 'd0298a48d1221c5ceb53c4879301507f'])
        .then((results) => {
          expect(results.rows.length).toBe(2);
          expect(results.rows[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(() => {
          done();
        });
      });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014a18.pdf');
    });

    it('should delete the document in the database', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return documents.delete(response.json._id, response.json._rev);
      })
      .then(() => {
        return request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`);
      })
      .then(done.fail)
      .catch((error) => {
        expect(error.json.error).toBe('not_found');
        expect(error.json.reason).toBe('deleted');
        done();
      });
    });

    it('should delete the document references', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return documents.delete(response.json._id, response.json._rev);
      })
      .then(() => {
        return request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c00`);
      })
      .then(done.fail)
      .catch((error) => {
        expect(error.json.error).toBe('not_found');
        expect(error.json.reason).toBe('deleted');
        done();
      });
    });

    it('should delete references to the document', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return documents.delete(response.json._id, response.json._rev);
      })
      .then(() => {
        return request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c01`);
      })
      .then(done.fail)
      .catch((error) => {
        expect(error.json.error).toBe('not_found');
        expect(error.json.reason).toBe('deleted');
        done();
      });
    });

    //it('should delete the document conversion', (done) => {
      //request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      //.then((response) => {
        //return documents.delete(response.json._id, response.json._rev);
      //})
      //.then(() => {
        //return request.get(`${dbURL}/a9a88a38dbd9fedc9d5051741a14a1d9`);
      //})
      //.then(done.fail)
      //.catch((error) => {
        //expect(error.json.error).toBe('not_found');
        //expect(error.json.reason).toBe('deleted');
        //done();
      //});
    //});

    it('should delete the original file', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return documents.delete(response.json._id, response.json._rev);
      })
      .then(() => {
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014a18.pdf')).toBe(false);
        done();
      });
    });
  });
});
