import { catchErrors } from 'api/utils/jasmineHelpers';
import { mockID } from 'shared/uniqueID';
import relationships from 'api/relationships';
import entities from 'api/entities';
import { search } from 'api/search';
import db from 'api/utils/testing_db';
import { fileExistsOnPath, uploadsPath } from 'api/files';

import { fixtures } from './fixtures';
import { documents } from '../documents.js';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';

describe('documents', () => {
  beforeEach(done => {
    spyOn(relationships, 'saveEntityBasedReferences').and.callFake(async () => Promise.resolve());
    spyOn(search, 'delete').and.callFake(async () => Promise.resolve());
    spyOn(search, 'bulkIndex').and.callFake(async () => Promise.resolve());
    mockID();
    db.setupFixturesAndContext(fixtures).then(done).catch(catchErrors(done));
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
      spyOn(entities, 'save').and.callFake(async () => Promise.resolve('result'));
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
      spyOn(entities, 'save').and.callFake(async () => Promise.resolve('result'));
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
    beforeEach(async () => {
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'), '');
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'), '');
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'), '');
    });

    it('should delete the document in the database', async () => {
      await documents.delete('shared');
      const result = await documents.getById('shared', 'es');
      expect(result).not.toBeDefined();
    });

    it('should delete the original file', async () => {
      await documents.delete('shared');
      expect(await fileExistsOnPath(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(
        false
      );
      expect(await fileExistsOnPath(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(
        false
      );
      expect(await fileExistsOnPath(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(
        false
      );
    });
  });
});
