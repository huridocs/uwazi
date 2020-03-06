/** @format */

import path from 'path';
import fs from 'fs';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import { files } from 'api/files/files';
import { search } from 'api/search';
import settings from 'api/settings';
import * as fileUtils from 'api/files/filesystem';

import CSVLoader from '../csvLoader';
import fixtures, { template1Id } from './fixtures';
import { createTestingZip } from './helpers';

import configPaths from '../../config/paths';

const removeTestingZip = () =>
  new Promise(resolve => {
    fs.unlink(path.join(__dirname, 'zipData/testLanguages.zip'), () => {
      resolve();
    });
  });

describe('csvLoader languages', () => {
  let imported;
  const loader = new CSVLoader();

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());

    const { languages } = await settings.get();
    await settings.save({ languages: [...languages, { key: 'es' }] });

    await createTestingZip(
      [
        path.join(__dirname, 'zipData/languages/import.csv'),
        path.join(__dirname, '/zipData/1.pdf'),
        path.join(__dirname, '/zipData/2.pdf'),
      ],
      'testLanguages.zip'
    );
    const csv = path.join(__dirname, 'zipData/testLanguages.zip');
    spyOn(fileUtils, 'generateFileName').and.callFake(file => `generated${file.originalname}`);
    configPaths.uploadedDocuments = path.join(__dirname, '/');
    await loader.load(csv, template1Id, { language: 'en' });

    imported = await entities.get();
  });

  afterAll(async () => {
    const generatedImages = (await files.get({})).map(u => u._id.toString());
    await fileUtils.deleteFiles([
      path.join(configPaths.uploadedDocuments, 'generated1.pdf'),
      path.join(configPaths.uploadedDocuments, 'generated2.pdf'),
      path.join(configPaths.uploadedDocuments, `${generatedImages[0]}.jpg`),
      path.join(configPaths.uploadedDocuments, `${generatedImages[1]}.jpg`),
      path.join(configPaths.uploadedDocuments, `${generatedImages[2]}.jpg`),
      path.join(configPaths.uploadedDocuments, `${generatedImages[3]}.jpg`),
      path.join(configPaths.uploadedDocuments, `${generatedImages[4]}.jpg`),
      path.join(configPaths.uploadedDocuments, `${generatedImages[5]}.jpg`),
    ]);

    await removeTestingZip();
    await db.disconnect();
  });

  it('should import entities in the diferent languages', async () => {
    const enTitles = imported.filter(e => e.language === 'en').map(i => i.title);
    const esTitles = imported.filter(e => e.language === 'es').map(i => i.title);
    expect(enTitles).toEqual(['title_en1', 'title_en2', 'title_en3']);
    expect(esTitles).toEqual(['title_es1', 'title_es2', 'title_es3']);
  });

  it('should import translated metadata properties', async () => {
    const enText = imported
      .filter(e => e.language === 'en')
      .map(i => i.metadata.text_label[0].value);
    const esText = imported
      .filter(e => e.language === 'es')
      .map(i => i.metadata.text_label[0].value);
    expect(enText).toEqual(['text_en1', 'text_en2', 'text_en3']);
    expect(esText).toEqual(['text_es1', 'text_es2', 'text_es3']);
  });

  it('should import translated files', async () => {
    const importedFiles = await files.get({ type: 'document' });
    expect(importedFiles.map(f => f.filename)).toEqual(['generated2.pdf', 'generated1.pdf']);
  });
});
