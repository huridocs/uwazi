import fs from 'fs';

import { catchErrors } from 'api/utils/jasmineHelpers';
import { mockID } from 'shared/uniqueID';
import relationships from 'api/relationships';
import entities from 'api/entities';
import search from 'api/search/search';
import db from 'api/utils/testing_db';
import { files } from 'api/files';
import { fileExists, uploadsPath } from 'api/files/filesystem';

import { fixtures, document1 } from './fixtures';
import { documents } from '../documents.js';

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

  afterAll(async () => db.disconnect());

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
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'), '');
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'), '');
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'), '');
    });

    it('should delete the document in the database', async () => {
      await documents.delete('shared');
      const result = await documents.getById('shared', 'es');
      expect(result).not.toBeDefined();
    });

    it('should delete the original file', async () => {
      await documents.delete('shared');
      expect(await fileExists(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(false);
      expect(await fileExists(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(false);
      expect(await fileExists(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(false);
    });
  });

  describe('pdfInfo', () => {
    it('should save pdfInfo and return it or just return it if already existed', async () => {
      const testingPdfInfo = {
        1: { chars: 10 },
        2: { chars: 20 },
      };
      const pdfInfoNOTPresent = await documents.savePDFInfo(document1, testingPdfInfo);
      expect(pdfInfoNOTPresent.pdfInfo).toBe(testingPdfInfo);
      const pdfInfoStored = await files.get(document1, '+pdfInfo');
      expect(pdfInfoStored[0].pdfInfo).toEqual(testingPdfInfo);

      spyOn(files, 'save').and.callThrough();
      const pdfInfoPresent = await documents.savePDFInfo(document1, testingPdfInfo);
      expect(files.save).not.toHaveBeenCalled();
      expect(pdfInfoPresent.pdfInfo).toEqual(testingPdfInfo);
    });
  });
});
