import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import fs from 'fs';
import {mockID} from 'shared/uniqueID';
import references from 'api/references';
import entities from 'api/entities';
import search from 'api/search/search';

import documents from '../documents.js';
import fixtures from './fixtures.js';
import {db} from 'api/utils';

describe('documents', () => {
  beforeEach((done) => {
    spyOn(references, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(search, 'index').and.returnValue(Promise.resolve());
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    mockID();
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('get', () => {
    describe('when passing query', () => {
      it('should return matching document', (done) => {
        documents.get({sharedId: 'shared'})
        .then((docs) => {
          expect(docs[1].title).toBe('Penguin almost done');
          expect(docs[1].fullText).not.toBeDefined();
          expect(docs[0].title).toBe('Batman finishes');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('save', () => {
    it('should call entities.save', (done) => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve('result'));
      let doc = {title: 'Batman begins'};
      let user = {_id: db.id()};
      let language = 'es';

      documents.save(doc, {user, language})
      .then((docs) => {
        expect(entities.save).toHaveBeenCalledWith({title: 'Batman begins', type: 'document'}, {user, language});
        expect(docs).toBe('result');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should assign unique ids to toc entries', (done) => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      let doc = {title: 'Batman begins', toc: [{}, {}]};
      let user = {_id: db.id()};

      documents.save(doc, {user, language: 'es'})
      .then(() => documents.getById('unique_id', 'es'))
      .then((result) => {
        expect(result.toc[0]._id.toString()).toBeDefined();
        expect(result.toc[1]._id).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf');
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf');
    });

    it('should delete the document in the database', (done) => {
      return documents.delete('shared')
      .then(() => documents.getById('shared', 'es'))
      .then((result) => {
        expect(result).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the original file', (done) => {
      documents.delete('shared')
      .then(() => {
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf')).toBe(false);
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf')).toBe(false);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
