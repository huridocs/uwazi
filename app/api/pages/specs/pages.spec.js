import { catchErrors } from 'api/utils/jasmineHelpers';
import { mockID } from 'shared/uniqueID';
import date from 'api/utils/date.js';
import db from 'api/utils/testing_db';

import fixtures, { pageToUpdate } from './fixtures.js';
import pages from '../pages.js';

describe('pages', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('save', () => {
    it('should create a new document with logged user id and UTC date for each language', done => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      mockID('sharedid');

      const doc = { title: 'Batman begins' };
      const user = { _id: db.id() };

      pages
        .save(doc, user, 'es')
        .then(result =>
          Promise.all([
            pages.getById(result.sharedId, 'es', 'title creationDate user'),
            pages.getById(result.sharedId, 'en', 'title creationDate user'),
            pages.getById(result.sharedId, 'pt', 'title creationDate user'),
          ])
        )
        .then(([es, en, pt]) => {
          expect(es.title).toBe(doc.title);
          expect(en.title).toBe(doc.title);
          expect(pt.title).toBe(doc.title);
          expect(es.user.equals(user._id)).toBe(true);
          expect(es.creationDate).toEqual(1);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should return the newly created document', done => {
      const doc = { title: 'the dark knight' };
      const user = { _id: db.id() };

      pages
        .save(doc, user, 'es')
        .then(createdDocument => {
          expect(createdDocument._id.toString()).toBeDefined();
          expect(createdDocument.title).toBe(doc.title);
          expect(createdDocument.language).toBe('es');
          return pages.get(createdDocument._id, 'creationDate user');
        })
        .then(([createdDocument]) => {
          expect(createdDocument.user.equals(user._id)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when updating', () => {
      it('should not assign again user and creation date and partial update data', done => {
        spyOn(date, 'currentUTC').and.returnValue(10);

        return pages
          .save({ _id: pageToUpdate, sharedId: '1', title: 'Edited title' }, 'another_user')
          .then(modifiedDoc => {
            expect(modifiedDoc.title).toBe('Edited title');
            return pages.get(modifiedDoc._id, 'creationDate user');
          })
          .then(([doc]) => {
            expect(doc.user).not.toBe('another_user');
            expect(doc.creationDate).toBe(1);
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });

  describe('delete', () => {
    it('should delete the document in all languages', done => {
      const sharedId = '1';
      return pages
        .delete(sharedId)
        .then(() => pages.get({ sharedId }))
        .then(result => {
          expect(result.length).toBe(0);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('addLanguage()', () => {
    it('should duplicate all the pages from the default language to the new one', done => {
      pages
        .addLanguage('ab')
        .then(() => pages.get({ language: 'ab' }))
        .then(newPages => {
          expect(newPages.length).toBe(2);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('getById', () => {
    it('Throws 404 error on unexistent id', done => {
      pages
        .getById('unexistent_id')
        .then(() => {
          done.fail('It should throw and error');
        })
        .catch(error => {
          expect(error.code).toBe(404);
          done();
        });
    });
  });
});
