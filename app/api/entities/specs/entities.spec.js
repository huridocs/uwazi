import {db_url as dbURL} from 'api/config/database.js';
import entities from '../entities.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import references from 'api/references';

describe('entities', () => {
  beforeEach((done) => {
    spyOn(references, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('save', () => {
    let getDocuments = () => request.get(dbURL + '/_design/entities/_view/all').then((response) => response.json.rows.map(r => r.value));
    let getDocument = (id = '8202c463d6158af8065022d9b5014ccb') => request.get(dbURL + `/${id}`).then((response) => response.json);

    it('should create a new document with logged user id and UTC date', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      entities.save(doc, user)
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

      entities.save(doc, user)
      .then(() => {
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._rev).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: 'user Id'};

      entities.save(doc, user)
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
          return entities.save(modifiedDoc, 'another_user');
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
          return entities.save(modifiedDoc);
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

  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', (done) => {
      entities.countByTemplate('template1')
      .then((count) => {
        expect(count).toBe(2);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      entities.countByTemplate('newTemplate')
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities for the user', (done) => {
      let user = {_id: 'c08ef2532f0bd008ac5174b45e033c94'};
      entities.getUploadsByUser(user)
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
    let getDocumentsByTemplate = (template) => request.get(dbURL + '/_design/entities/_view/metadata_by_template?key="' + template + '"')
    .then((response) => {
      return response.json.rows.map((r) => r.value);
    });

    it('should update metadata property names on the entities matching the template', (done) => {
      let nameChanges = {property1: 'new_name1', property2: 'new_name2'};
      entities.updateMetadataProperties('template1', nameChanges)
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
      entities.updateMetadataProperties('template1', nameChanges, deleteProperties)
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

  describe('list', () => {
    it('should return a list of entities with the title', (done) => {
      entities.list()
      .then((results) => {
        expect(results.rows.length).toBe(7);
        expect(results.rows[0].title).toBe('Batman finishes');
        done();
      })
      .catch(done.fail);
    });

    describe('when giving a list of keys', () => {
      it('should return only those entities', (done) => {
        entities.list(['8202c463d6158af8065022d9b5014ccb', 'd0298a48d1221c5ceb53c4879301507f'])
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
    it('should delete the document in the database', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return entities.delete(response.json._id, response.json._rev);
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
        return entities.delete(response.json._id, response.json._rev);
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
        return entities.delete(response.json._id, response.json._rev);
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
  });
});
