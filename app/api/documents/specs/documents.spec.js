import { catchErrors } from 'api/utils/jasmineHelpers';
import fs from 'fs';
import { mockID } from 'shared/uniqueID';
import relationships from 'api/relationships';
import entities from 'api/entities';
import search from 'api/search/search';
import db from 'api/utils/testing_db';
import path from 'path';
import documents from '../documents.js';
import fixtures from './fixtures.js';
import paths from '../../config/paths';

describe('documents', () => {
  beforeEach(done => {
    spyOn(relationships, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    spyOn(search, 'bulkIndex').and.returnValue(Promise.resolve());
    mockID();
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('get', () => {
    describe('when passing query', () => {
      it('should return matching document', done => {
        documents
          .get({ sharedId: 'shared' })
          .then(docs => {
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
    it('should call entities.save', done => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve('result'));
      const doc = { title: 'Batman begins' };
      const user = { _id: db.id() };
      const language = 'es';

      documents
        .save(doc, { user, language })
        .then(docs => {
          expect(entities.save).toHaveBeenCalledWith(
            { title: 'Batman begins' },
            { user, language }
          );
          expect(docs).toBe('result');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should not allow passing a file', done => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve('result'));
      const doc = { title: 'Batman begins', file: 'file' };
      const user = { _id: db.id() };
      const language = 'es';

      documents
        .save(doc, { user, language })
        .then(docs => {
          expect(entities.save).toHaveBeenCalledWith(
            { title: 'Batman begins' },
            { user, language }
          );
          expect(docs).toBe('result');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'));
      fs.writeFileSync(path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'));
      fs.writeFileSync(path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'));
    });

    it('should delete the document in the database', done =>
      documents
        .delete('shared')
        .then(() => documents.getById('shared', 'es'))
        .then(result => {
          expect(result).not.toBeDefined();
          done();
        })
        .catch(catchErrors(done)));

    it('should delete the original file', done => {
      documents
        .delete('shared')
        .then(() => {
          expect(
            fs.existsSync(
              path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf')
            )
          ).toBe(false);
          expect(
            fs.existsSync(
              path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf')
            )
          ).toBe(false);
          expect(
            fs.existsSync(
              path.join(paths.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf')
            )
          ).toBe(false);
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
