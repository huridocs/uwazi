import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Fixture } from '../types';
import {
  attachmentFile1,
  attachmentFile2,
  attachmentWithInvalidExtension,
  fileWithDefinedMimeType,
  fixtures,
  primaryDocument,
  primaryDocument2,
  primaryDocument3,
  primaryDocument4,
} from './fixtures';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(172);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should detect and assign a MIME-type ONLY for files without one', async () => {
    await migration.up(db!);

    const files = await db!.collection('files').find({}).sort({ creationDate: 1 }).toArray();

    expect(files).toHaveLength(fixtures.files.length);

    expect(files).toEqual([
      { ...primaryDocument, mimetype: 'application/pdf' },
      { ...primaryDocument2, mimetype: 'application/pdf' },
      { ...primaryDocument3, mimetype: 'application/pdf' },
      { ...primaryDocument4, mimetype: 'application/pdf' },
      {
        ...attachmentFile1,
        mimetype: 'image/png',
      },
      {
        ...attachmentFile2,
        mimetype: 'text/plain',
      },
      {
        ...attachmentWithInvalidExtension,
        mimetype: 'application/octet-stream',
      },
      fileWithDefinedMimeType,
    ]);
  });
});
