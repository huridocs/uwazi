import db from 'api/utils/testing_db';
import entities from 'api/entities';
import { search } from 'api/search';
import path from 'path';
import fs from 'fs';
import * as fileUtils from 'api/utils/files';

import CSVLoader from '../csvLoader';
import fixtures, { template1Id } from './fixtures';

import configPaths from '../../config/paths';
import { createTestingZip, fileExists } from './helpers';

const removeTestingZip = () =>
  new Promise(resolve => {
    fs.unlink(path.join(__dirname, '/zipData/test.zip'), () => {
      resolve();
    });
  });

describe('csvLoader zip file', () => {
  let imported;
  afterAll(async () => db.disconnect());
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
      ],
      'test.zip'
    );
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(fileUtils, 'generateFileName').and.callFake(file => `generated${file.originalname}`);
    configPaths.uploadedDocuments = path.join(__dirname, '/zipData/');
    await loader.load(zip, template1Id);
    imported = await entities.get({}, '+fullText');
  });

  afterAll(async () => {
    await fileUtils.deleteFiles([
      path.join(configPaths.uploadedDocuments, 'generated1.pdf'),
      path.join(configPaths.uploadedDocuments, 'generated2.pdf'),
      path.join(configPaths.uploadedDocuments, 'generated3.pdf'),
      path.join(configPaths.uploadedDocuments, `${imported[0]._id}.jpg`),
      path.join(configPaths.uploadedDocuments, `${imported[1]._id}.jpg`),
      path.join(configPaths.uploadedDocuments, `${imported[2]._id}.jpg`),
    ]);
    await removeTestingZip();
  });

  it('should save files into uploaded_documents', async () => {
    expect(await fileExists('generated1.pdf')).toBe(true);
    expect(await fileExists('generated2.pdf')).toBe(true);
    expect(await fileExists('generated3.pdf')).toBe(true);
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
        uploaded: true,
        processed: true,
        fullText: { 1: '1[[1]]\n\n' },
        file: expect.objectContaining({
          filename: 'generated1.pdf',
          originalname: '1.pdf',
        }),
      })
    );
    expect(imported[1]).toEqual(
      expect.objectContaining({
        uploaded: true,
        processed: true,
        fullText: { 1: '2[[1]]\n\n' },
        file: expect.objectContaining({
          filename: 'generated2.pdf',
          originalname: '2.pdf',
        }),
      })
    );
  });
});
