import db from 'api/utils/testing_db';
import { files } from 'api/files/files';
import { search } from 'api/search';
import path from 'path';
import fs from 'fs';
import * as fileUtils from 'api/files/filesystem';
import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';
import { EntitySchema } from 'shared/types/entityType';

import { CSVLoader } from '../csvLoader';
import fixtures, { template1Id } from './fixtures';

import configPaths from '../../config/paths';
import { createTestingZip, fileExists } from './helpers';

const removeTestingZip = async () =>
  new Promise(resolve => {
    fs.unlink(path.join(__dirname, '/zipData/test.zip'), () => {
      resolve();
    });
  });

describe('csvLoader zip file', () => {
  let imported: FileType[];
  beforeAll(async () => {
    const zip = path.join(__dirname, '/zipData/test.zip');
    const loader = new CSVLoader();
    await db.clearAllAndLoad(fixtures);
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
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(fileUtils, 'generateFileName').and.callFake(file => `generated${file.originalname}`);
    configPaths.uploadedDocuments = path.join(__dirname, '/zipData/');
    configPaths.attachments = path.join(__dirname, '/zipData/attachments');
    await loader.load(zip, template1Id);
    imported = await files.get({ type: 'document' }, '+fullText');
  });

  afterAll(async () => {
    await fileUtils.deleteFiles([
      path.join(configPaths.uploadedDocuments, 'generated1.pdf'),
      path.join(configPaths.uploadedDocuments, 'generated2.pdf'),
      path.join(configPaths.uploadedDocuments, 'generated3.pdf'),
      path.join(configPaths.attachments, 'generatedatt1.doc'),
      path.join(configPaths.attachments, 'generatedatt2.jpg'),
      path.join(configPaths.uploadedDocuments, `${imported[0]._id}.jpg`),
      path.join(configPaths.uploadedDocuments, `${imported[1]._id}.jpg`),
      path.join(configPaths.uploadedDocuments, `${imported[2]._id}.jpg`),
    ]);
    await removeTestingZip();
    await db.disconnect();
  });

  it('should save files into uploaded_documents', async () => {
    expect(await fileExists('generated1.pdf')).toBe(true);
    expect(await fileExists('generated2.pdf')).toBe(true);
    expect(await fileExists('generated3.pdf')).toBe(true);

    expect(await fileExists('generatedatt1.doc', configPaths.attachments)).toBe(true);
    expect(await fileExists('generatedatt2.jpg', configPaths.attachments)).toBe(true);
  });

  it('should create thumbnails of the pdf files', async () => {
    expect(await fileExists(`${imported[0]._id}.jpg`)).toBe(true);
    expect(await fileExists(`${imported[1]._id}.jpg`)).toBe(true);
    expect(await fileExists(`${imported[2]._id}.jpg`)).toBe(true);
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
    const importedEntities: EntitySchema = await entities.get();

    expect(importedEntities[0].attachments.length).toBe(1);
    expect(importedEntities[0].attachments[0]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt1.doc',
        originalname: 'att1.doc',
      })
    );

    expect(importedEntities[1].attachments.length).toBe(2);
    expect(importedEntities[1].attachments[0]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt1.doc',
        originalname: 'att1.doc',
      })
    );
    expect(importedEntities[1].attachments[1]).toEqual(
      expect.objectContaining({
        filename: 'generatedatt2.jpg',
        originalname: 'att2.jpg',
      })
    );
  });
});
