import {db_url as dbURL} from 'api/config/database.js';
import pages from '../pages.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';

describe('pages', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('save', () => {
    let getDocuments = () => request.get(dbURL + '/_design/pages/_view/all').then((response) => response.json.rows.map(r => r.value));
    let getDocument = (id = '8202c463d6158af8065022d9b50ddccb') => request.get(dbURL + `/${id}`).then(response => response.json);

    it('should create a new document with logged user id and UTC date', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      pages.save(doc, user)
      .then(getDocuments)
      .then((docs) => {
        let createdDocument = docs.find(d => d.title === 'Batman begins');
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user).toEqual(user);
        expect(createdDocument.creationDate).toEqual('universal time');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: 'user Id'};

      pages.save(doc, user)
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
          return pages.save(modifiedDoc, 'another_user');
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
          return pages.save(modifiedDoc);
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

  describe('list', () => {
    it('should return a list of pages with the title', (done) => {
      pages.list()
      .then((results) => {
        expect(results.rows.length).toBe(3);
        expect(results.rows[0].title).toBe('Batman finishes');
        done();
      })
      .catch(done.fail);
    });

    describe('when giving a list of keys', () => {
      it('should return only those pages', (done) => {
        pages.list(['8202c463d6158af8065022d9b50dda18', 'd0298a48d1221c5ceb53c487930dd07f'])
        .then((results) => {
          expect(results.rows.length).toBe(2);
          expect(results.rows[1].title).toBe('Right there');
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
      request.get(`${dbURL}/8202c463d6158af8065022d9b50dda18`)
      .then((response) => {
        return pages.delete(response.json._id);
      })
      .then(() => {
        return request.get(`${dbURL}/8202c463d6158af8065022d9b50dda18`);
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
