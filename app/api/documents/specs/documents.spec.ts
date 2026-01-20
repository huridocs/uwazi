import entities from '#api/entities/index.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { fileExistsOnPath, uploadsPath } from '#api/files/index.js';

import relationships from '#api/relationships/index.js';

import { search } from '#api/search/index.js';

import db from '#api/utils/testing_db.js';

import { mockID } from '#shared/uniqueID.js';

// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { documents } from '#api/documents/documents.js';
import { fixtures } from '#api/documents/specs/fixtures.js';

describe('documents', () => {
  beforeEach(async () => {
    jest
      .spyOn(relationships, 'saveEntityBasedReferences')
      .mockImplementation(async () => Promise.resolve());
    // @ts-ignore
    jest.spyOn(search, 'delete').mockImplementation(async () => Promise.resolve());
    // @ts-ignore
    jest.spyOn(search, 'bulkIndex').mockImplementation(async () => Promise.resolve());
    mockID();
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('get', () => {
    describe('when passing query', () => {
      it('should return matching document', async () => {
        const docs = await documents.get({ sharedId: 'shared' });
        expect(docs[1].title).toBe('Penguin almost done');
        expect(docs[1].fullText).not.toBeDefined();
        expect(docs[0].title).toBe('Batman finishes');
      });
    });
  });

  describe('save', () => {
    it('should call entities.save', async () => {
      jest.spyOn(entities, 'save').mockImplementation(async () => Promise.resolve('result'));
      const doc = { title: 'Batman begins' };
      const user = { _id: db.id() };
      const language = 'es';

      const docs = await documents.save(doc, { user, language });
      expect(entities.save).toHaveBeenCalledWith({ title: 'Batman begins' }, { user, language });
      expect(docs).toBe('result');
    });

    it('should not allow passing a file', async () => {
      jest.spyOn(entities, 'save').mockImplementation(async () => Promise.resolve('result'));
      const doc = { title: 'Batman begins', file: 'file' };
      const user = { _id: db.id() };
      const language = 'es';

      const docs = await documents.save(doc, { user, language });
      expect(entities.save).toHaveBeenCalledWith({ title: 'Batman begins' }, { user, language });
      expect(docs).toBe('result');
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
