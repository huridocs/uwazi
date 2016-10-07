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

    it('should create a new entity for each language in settings with a language property and a shared id', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      entities.save(doc, {user, language: 'es'})
      .then(getDocuments)
      .then((docs) => {
        let createdDocumentEs = docs.find((d) => d.title === 'Batman begins' && d.language === 'es');
        let createdDocumentEn = docs.find((d) => d.title === 'Batman begins' && d.language === 'en');

        expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

        expect(createdDocumentEs.title).toBe(doc.title);
        expect(createdDocumentEs.user).toEqual(user);
        expect(createdDocumentEs.creationDate).toEqual('universal time');

        expect(createdDocumentEn.title).toBe(doc.title);
        expect(createdDocumentEn.user).toEqual(user);
        expect(createdDocumentEn.creationDate).toEqual('universal time');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document for the passed language', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: 'user Id'};

      entities.save(doc, {user, language: 'en'})
      .then((createdDocument) => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument._rev).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user).toEqual(user);
        expect(createdDocument.language).toEqual('en');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should saveEntityBasedReferences', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      entities.save(doc, {user, language: 'es'})
      .then(() => {
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._rev).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', (done) => {
        spyOn(date, 'currentUTC').and.returnValue('another_date');
        getDocument()
        .then((doc) => {
          let modifiedDoc = {_id: doc._id, _rev: doc._rev, sharedId: doc.sharedId, language: doc.language};
          return entities.save(modifiedDoc, {user: 'another_user', language: 'en'});
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
          let modifiedDoc = {_id: doc._id, _rev: doc._rev, test: 'test', sharedId: doc.sharedId, language: doc.language};
          return entities.save(modifiedDoc, {language: 'en'});
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

  describe('get', () => {
    it('should return matching document for language', (done) => {
      let id = 'sharedId';

      Promise.all([
        entities.get(id, 'en'),
        entities.get(id, 'es')
      ])
      .then(([enDoc, esDoc]) => {
        expect(enDoc.rows[0].title).toBe('doc1 english');
        expect(esDoc.rows[0].title).toBe('doc1 spanish');
        done();
      })
      .catch(catchErrors(done));
    });
  });
  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', (done) => {
      entities.countByTemplate('template1')
      .then((count) => {
        expect(count).toBe(3);
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

  describe('getByTemplate', () => {
    it('should return all entities with passed template and language', (done) => {
      entities.getByTemplate('template1', 'en')
      .then((docs) => {
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('doc1 english');
        expect(docs[1].title).toBe('doc2');
        done();
      })
      .catch(done.fail);
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

  describe('delete', () => {
    it('should delete the document in the database', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
      .then((response) => {
        return entities.delete(response.json.sharedId);
      })
      .then(() => {
        return request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`);
      })
      .then(done.fail)
      .catch((error) => {
        expect(error.json.error).toBe('not_found');
        expect(error.json.reason).toBe('deleted');
        return request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`);
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
        return entities.delete(response.json._id);
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
