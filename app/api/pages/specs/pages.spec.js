import {db_url as dbURL} from 'api/config/database.js';
import pages from '../pages.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import {mockID} from 'shared/uniqueID';
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
    let getPageInAllLanguages = (sharedId) => {
      return request.get(`${dbURL}/_design/pages/_view/sharedId?key="${sharedId}"`).then((response) => response.json.rows.map(r => r.value));
    };
    let getDocument = (id = '8202c463d6158af8065022d9b50ddccb') => request.get(dbURL + `/${id}`).then(response => response.json);

    it('should create a new document with logged user id and UTC date for each language', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      mockID('sharedid');
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};

      pages.save(doc, user, 'es')
      .then(() => getPageInAllLanguages('sharedid'))
      .then((docs) => {
        expect(docs.length).toBe(3);
        expect(docs[0].language).toBe('es');
        expect(docs[0].title).toBe(doc.title);
        expect(docs[0].user).toEqual(user);
        expect(docs[0].creationDate).toEqual('universal time');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: 'user Id'};

      pages.save(doc, user, 'es')
      .then((createdDocument) => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument._rev).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user).toEqual(user);
        expect(createdDocument.language).toBe('es');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when updating', () => {
      it('should not assign again user and creation date', (done) => {
        spyOn(date, 'currentUTC').and.returnValue('another_date');
        getDocument()
        .then((doc) => {
          return pages.save(doc, 'another_user');
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
    });
  });

  describe('list', () => {
    it('should return a list of pages for the given language', (done) => {
      pages.list('es')
      .then((results) => {
        expect(results.rows.length).toBe(2);
        expect(results.rows[0].title).toBe('Batman finishes');
        expect(results.rows[1].title).toBe('Penguin almost done');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete', () => {
    it('should delete the document in all languages', (done) => {
      let sharedId = '1';
      return pages.delete(sharedId)
      .then(() => {
        return request.get(`${dbURL}/_design/pages/_view/sharedId?key="1"`);
      })
      .then((result) => {
        expect(result.json.rows.length).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });
});
