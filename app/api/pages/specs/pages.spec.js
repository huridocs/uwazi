import {db_url as dbURL} from 'api/config/database.js';
import pages from '../pages.js';
import database from 'api/utils/database.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import {mockID} from 'shared/uniqueID';
import date from 'api/utils/date.js';

import fixtures from './fixtures.js';
import {db} from 'api/utils';

describe('pages', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('save', () => {
    let getPageInAllLanguages = (sharedId) => {
      return request.get(`${dbURL}/_design/pages/_view/sharedId?key="${sharedId}"`).then((response) => response.json.rows.map(r => r.value));
    };
    let getDocument = (id = '8202c463d6158af8065022d9b50ddccb') => request.get(dbURL + `/${id}`).then(response => response.json);

    fit('should create a new document with logged user id and UTC date for each language', (done) => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      mockID('sharedid');

      let doc = {title: 'Batman begins'};
      let user = {username: 'bruce'};

      pages.save(doc, user, 'es')
      .then((result) => {
        return pages.get({sharedId: result.sharedId});
      })
      .then((docs) => {
        expect(docs.length).toBe(3);
        expect(docs[0].language).toBe('es');
        expect(docs[0].title).toBe(doc.title);
        expect(docs[0].user.username).toEqual(user.username);
        expect(docs[0].creationDate).toEqual(1);
        done();
      })
      .catch(catchErrors(done));
    });

    fit('should return the newly created document', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {username: 'user Id'};

      pages.save(doc, user, 'es')
      .then((createdDocument) => {
        expect(createdDocument._id.toString()).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user.username).toEqual(user.username);
        expect(createdDocument.language).toBe('es');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when updating', () => {
      ffit('should not assign again user and creation date and partial update data', (done) => {
        spyOn(date, 'currentUTC').and.returnValue('another_date');

        return pages.save({sharedId: 'sharedId', title: 'Edited title'}, 'another_user')
        .then((modifiedDoc) => {
          expect(modifiedDoc.title).toBe('Edited title');
          expect(modifiedDoc.user).not.toBe('another_user');
          expect(modifiedDoc.creationDate).toBe('1');
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
      .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    fit('should delete the document in all languages', (done) => {
      let sharedId = '1';
      return pages.delete(sharedId)
      .then(() => {
        return pages.get({sharedId});
      })
      .then((result) => {
        expect(result.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
