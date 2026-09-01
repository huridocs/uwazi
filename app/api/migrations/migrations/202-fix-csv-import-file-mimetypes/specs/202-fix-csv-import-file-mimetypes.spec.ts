/* eslint-disable max-statements */
import { Db, ObjectId } from 'mongodb';
import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import {
  alreadyCorrectPdf,
  csvImportedDocx,
  csvImportedExtraA,
  csvImportedHtml,
  csvImportedLangPdf,
  csvImportedPdf,
  customUploadPdf,
  extractionOnlyPdf,
  fixtures,
  unrelatedHtmlLabeledPdf,
  unusedZipFile,
  urlAttachmentPdf,
} from './fixtures.js';

jest.setTimeout(30000);

let db: Db | null;

const mimetypeOf = async (id: ObjectId) => {
  const file = await db!.collection('files').findOne({ _id: id });
  return file?.mimetype;
};

const statusOf = async (id: ObjectId) => {
  const file = await db!.collection('files').findOne({ _id: id });
  return file?.status;
};

describe('migration 202-fix-csv-import-file-mimetypes', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb!;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have expected metadata', () => {
    expect(migration.delta).toBe(202);
    expect(migration.reindex).toBe(false);
    expect(migration.requiresSchema).toBe(12);
  });

  it('should fix CSV-imported documents and attachments labeled as text/html', async () => {
    expect(await mimetypeOf(csvImportedPdf)).toBe('application/pdf');
    expect(await mimetypeOf(csvImportedExtraA)).toBe('application/pdf');
    expect(await mimetypeOf(csvImportedDocx)).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(await mimetypeOf(csvImportedLangPdf)).toBe('application/pdf');
  });

  it('should not re-process files, only update mimetype', async () => {
    expect(await statusOf(csvImportedPdf)).toBe('ready');
    expect(await statusOf(csvImportedExtraA)).toBe('processing');
  });

  it('should fall back to extraction filenames when an import has no staged rows', async () => {
    expect(await mimetypeOf(extractionOnlyPdf)).toBe('application/pdf');
  });

  it('should not use unused zip files when staged rows exist for that import', async () => {
    expect(await mimetypeOf(unusedZipFile)).toBe('text/html');
  });

  it('should not touch files that were not referenced by a CSV import', async () => {
    expect(await mimetypeOf(unrelatedHtmlLabeledPdf)).toBe('text/html');
  });

  it('should not overwrite files that already have the correct mimetype', async () => {
    expect(await mimetypeOf(alreadyCorrectPdf)).toBe('application/pdf');
  });

  it('should not touch URL attachments or custom uploads', async () => {
    expect(await mimetypeOf(urlAttachmentPdf)).toBe('text/html');
    expect(await mimetypeOf(customUploadPdf)).toBe('text/html');
  });

  it('should leave real HTML files as text/html', async () => {
    expect(await mimetypeOf(csvImportedHtml)).toBe('text/html');
  });

  it('should be idempotent', async () => {
    await migration.up(db!);

    expect(await mimetypeOf(csvImportedPdf)).toBe('application/pdf');
    expect(await mimetypeOf(unrelatedHtmlLabeledPdf)).toBe('text/html');
    expect(await mimetypeOf(urlAttachmentPdf)).toBe('text/html');
  });
});
