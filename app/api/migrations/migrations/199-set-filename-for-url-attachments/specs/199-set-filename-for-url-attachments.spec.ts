/* eslint-disable max-statements */
import testingDB from '#api/utils/testing_db.js';
import { fixtures } from './fixtures.js';
import migration from '../index.js';

jest.setTimeout(30000);

const createSut = () => ({
  ...migration,
  up: async () => migration.up(testingDB.mongodb!),
});

describe('migration set-filename-for-url-attachments', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have delta 199', () => {
    expect(createSut().delta).toBe(199);
  });

  it('should set filename to url when filename is missing', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 1: missing filename → should get url
    const file1 = files.find(f => f.originalname === 'existing-original.pdf');
    expect(file1?.filename).toBe('https://example.com/doc1.pdf');
  });

  it('should set originalname to url when originalname is missing', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 2: missing originalname → should get url
    const file2 = files.find(f => f.filename === 'existing-file.pdf');
    expect(file2?.originalname).toBe('https://example.com/doc2.pdf');
  });

  it('should set both filename and originalname to url when both are missing', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 3: both missing → should get url for both
    const file3 = files.find(f => f.url === 'https://example.com/doc3.pdf');
    expect(file3?.filename).toBe('https://example.com/doc3.pdf');
    expect(file3?.originalname).toBe('https://example.com/doc3.pdf');
  });

  it('should set both filename and originalname to url when they are empty strings', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 4: empty strings → should get url for both
    const file4 = files.find(f => f.url === 'https://example.com/doc4.pdf');
    expect(file4?.filename).toBe('https://example.com/doc4.pdf');
    expect(file4?.originalname).toBe('https://example.com/doc4.pdf');
  });

  it('should not touch URL attachments that already have both fields', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 5: already complete → should stay unchanged
    const file5 = files.find(f => f.url === 'https://example.com/doc5.pdf');
    expect(file5?.filename).toBe('already-has-filename.pdf');
    expect(file5?.originalname).toBe('already-has-original.pdf');
  });

  it('should not touch non-URL attachments (e.g. documents)', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 6: document type → should stay unchanged
    const file6 = files.find(f => f.type === 'document');
    expect(file6?.filename).toBe('doc.pdf');
    expect(file6?.originalname).toBe('doc-original.pdf');
  });

  it('should not touch attachments without a url field', async () => {
    const sut = createSut();
    await sut.up();

    const files = await testingDB.mongodb!.collection('files').find({}).toArray();

    // File 7: attachment without url → should stay unchanged
    const file7 = files.find(f => !f.url && f.type === 'attachment');
    expect(file7?.filename).toBe('no-url.pdf');
    expect(file7?.originalname).toBe('no-url-original.pdf');
  });

  it('should be idempotent — running up() twice produces the same result', async () => {
    const sut = createSut();
    await sut.up();
    await sut.up();

    const files = (await testingDB.mongodb!.collection('files').find({}).toArray()) as any[];

    // All matches should still be correct after second run
    const byUrlAndOriginalname =
      (url: string, originalname: string) => (f: { url?: string; originalname?: string }) =>
        f.url === url && f.originalname === originalname;
    const byUrlAndFilename =
      (url: string, filename: string) => (f: { url?: string; filename?: string }) =>
        f.url === url && f.filename === filename;
    const byUrl = (url: string) => (f: { url?: string }) => f.url === url;
    const byType = (type: string) => (f: { type?: string }) => f.type === type;
    const noUrlAttachment = (f: { url?: string; type?: string }) =>
      !f.url && f.type === 'attachment';

    const file1 = files.find(
      byUrlAndOriginalname('https://example.com/doc1.pdf', 'existing-original.pdf')
    );
    const file2 = files.find(byUrlAndFilename('https://example.com/doc2.pdf', 'existing-file.pdf'));
    const file3 = files.find(byUrl('https://example.com/doc3.pdf'));
    const file4 = files.find(byUrl('https://example.com/doc4.pdf'));
    const file5 = files.find(byUrl('https://example.com/doc5.pdf'));
    const file6 = files.find(byType('document'));
    const file7 = files.find(noUrlAttachment);

    expect(file1?.filename).toBe('https://example.com/doc1.pdf');
    expect(file2?.originalname).toBe('https://example.com/doc2.pdf');
    expect(file3?.filename).toBe('https://example.com/doc3.pdf');
    expect(file3?.originalname).toBe('https://example.com/doc3.pdf');
    expect(file4?.filename).toBe('https://example.com/doc4.pdf');
    expect(file4?.originalname).toBe('https://example.com/doc4.pdf');
    expect(file5?.filename).toBe('already-has-filename.pdf');
    expect(file5?.originalname).toBe('already-has-original.pdf');
    expect(file6?.filename).toBe('doc.pdf');
    expect(file7?.filename).toBe('no-url.pdf');
  });
});
