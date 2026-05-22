import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import {
  alreadyDetectedDocument,
  annotatedFrenchDocument,
  attachmentWithOther,
  documentWithoutFullText,
  fixtures,
  frenchDocument,
  noUpdateFixtures,
  spanishDocument,
  undetectableDocument,
} from './fixtures.js';

let db: Db | null;

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('190-re-detect-language-on-files', () => {
  describe('when some files have detectable language', () => {
    beforeAll(async () => {
      migration.reindex = false;
      await testingDB.setupFixturesAndContext(fixtures);
      db = testingDB.mongodb!;
      await migration.up(db);
    });

    it('should have the correct delta', () => {
      expect(migration.delta).toBe(190);
    });

    it('should update language for documents with detectable text', async () => {
      const french = await db!.collection('files').findOne({ _id: frenchDocument._id });
      expect(french!.language).toBe('fra');

      const annotatedFrench = await db!
        .collection('files')
        .findOne({ _id: annotatedFrenchDocument._id });
      expect(annotatedFrench!.language).toBe('fra');

      const spanish = await db!.collection('files').findOne({ _id: spanishDocument._id });
      expect(spanish!.language).toBe('spa');
    });

    it('should not update documents with undetectable text', async () => {
      const undetectable = await db!.collection('files').findOne({ _id: undetectableDocument._id });
      expect(undetectable!.language).toBe('other');
    });

    it('should not update documents without fullText', async () => {
      const noFullText = await db!
        .collection('files')
        .findOne({ _id: documentWithoutFullText._id });
      expect(noFullText!.language).toBe('other');
    });

    it('should not update attachments', async () => {
      const attachment = await db!.collection('files').findOne({ _id: attachmentWithOther._id });
      expect(attachment!.language).toBe('other');
    });

    it('should not update documents already detected', async () => {
      const alreadyDetected = await db!
        .collection('files')
        .findOne({ _id: alreadyDetectedDocument._id });
      expect(alreadyDetected!.language).toBe('fra');
    });

    it('should set reindex to true when files were updated', () => {
      expect(migration.reindex).toBe(true);
    });
  });

  describe('when no files have detectable language', () => {
    beforeAll(async () => {
      migration.reindex = false;
      await testingDB.setupFixturesAndContext(noUpdateFixtures);
      db = testingDB.mongodb!;
      await migration.up(db);
    });

    it('should not set reindex when no files were updated', () => {
      expect(migration.reindex).toBe(false);
    });
  });
});
