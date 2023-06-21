import db from 'api/utils/testing_db';
import { files } from 'api/files/files';
import { search } from 'api/search';
import path from 'path';
import * as filesystem from 'api/files/filesystem';
import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';
import { EntityWithFilesSchema } from 'shared/types/entityType';

import { CSVLoader } from '../csvLoader';
import { fixtures, template1Id } from './fixtures';

import { createTestingZip } from './helpers';

const removeTestingZip = async () =>
  filesystem.deleteFile(path.join(__dirname, 'zipData/test.zip'));

describe('csvLoader zip file', () => {
  let imported: FileType[];
  beforeAll(async () => {
    const zip = path.join(__dirname, '/zipData/test.zip');
    const loader = new CSVLoader();
    await db.setupFixturesAndContext(fixtures);
    await filesystem.setupTestUploadedPaths('csvLoaderZip');
    await createTestingZip(
      [
        path.join(__dirname, '/zipData/test.csv'),
        path.join(__dirname, '/zipData/import.csv'),
        path.join(__dirname, '/zipData/1.pdf'),
        path.join(__dirname, '/zipData/2.pdf'),
        path.join(__dirname, '/zipData/3.pdf'),
        path.join(__dirname, '/zipData/att1.doc'),
        path.join(__dirname, '/zipData/att2.jpg'),
      ],
      'test.zip'
    );
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest
      .spyOn(filesystem, 'generateFileName')
      .mockImplementation(file => `generated${file.originalname}`);
    await loader.load(zip, template1Id);
    imported = await files.get({ type: 'document' }, '+fullText');
  });

  afterAll(async () => {
    await filesystem.deleteFiles([
      filesystem.uploadsPath('generated1.pdf'),
      filesystem.uploadsPath('generated2.pdf'),
      filesystem.uploadsPath('generated3.pdf'),
      filesystem.uploadsPath(`${imported[0]._id}.jpg`),
      filesystem.uploadsPath(`${imported[1]._id}.jpg`),
      filesystem.uploadsPath(`${imported[2]._id}.jpg`),
      filesystem.attachmentsPath('generatedatt1.doc'),
      filesystem.attachmentsPath('generatedatt2.doc'),
    ]);
    await removeTestingZip();
    await db.disconnect();
  });

  it('should save files into uploaded_documents', async () => {
    expect(await filesystem.fileExistsOnPath(filesystem.uploadsPath('generated1.pdf'))).toBe(true);
    expect(await filesystem.fileExistsOnPath(filesystem.uploadsPath('generated2.pdf'))).toBe(true);
    expect(await filesystem.fileExistsOnPath(filesystem.uploadsPath('generated3.pdf'))).toBe(true);

    expect(await filesystem.fileExistsOnPath(filesystem.attachmentsPath('generatedatt1.doc'))).toBe(
      true
    );
    expect(await filesystem.fileExistsOnPath(filesystem.attachmentsPath('generatedatt2.jpg'))).toBe(
      true
    );
  });

  it('should create thumbnails of the pdf files', async () => {
    expect(
      await filesystem.fileExistsOnPath(filesystem.uploadsPath(`${imported[0]._id}.jpg`))
    ).toBe(true);
    expect(
      await filesystem.fileExistsOnPath(filesystem.uploadsPath(`${imported[1]._id}.jpg`))
    ).toBe(true);
    expect(
      await filesystem.fileExistsOnPath(filesystem.uploadsPath(`${imported[2]._id}.jpg`))
    ).toBe(true);
  });

  it('should import the file asociated with each entity', async () => {
    expect(imported.length).toBe(3);

    expect(imported[0]).toEqual(
      expect.objectContaining({
        status: 'ready',
        fullText: { 1: '1[[1]]\n\n' },
        filename: 'generated1.pdf',
        originalname: '1.pdf',
      })
    );
    expect(imported[1]).toEqual(
      expect.objectContaining({
        status: 'ready',
        fullText: { 1: '2[[1]]\n\n' },
        filename: 'generated2.pdf',
        originalname: '2.pdf',
      })
    );
  });

  it('should import the attachments asociated with each entity', async () => {
    const importedEntities = (await entities.get()) as EntityWithFilesSchema[];

    expect(importedEntities[0].attachments?.length).toBe(1);
    expect(importedEntities[0].attachments?.[0]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt1.doc',
        originalname: 'att1.doc',
      })
    );

    expect(importedEntities[1].attachments?.length).toBe(2);
    expect(importedEntities[1].attachments?.[0]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt1.doc',
        originalname: 'att1.doc',
      })
    );
    expect(importedEntities[1].attachments?.[1]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt2.jpg',
        originalname: 'att2.jpg',
      })
    );
  });
});
