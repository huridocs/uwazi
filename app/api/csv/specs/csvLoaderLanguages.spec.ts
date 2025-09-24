// @ts-expect-error TS(2307): Cannot find module '../entities.js' or its corresp... Remove this comment to see the full error message
import entities from '../entities.js';
// @ts-expect-error TS(2307): Cannot find module '../files/files.js' or its corr... Remove this comment to see the full error message
import { files } from '../files/files.js';
// @ts-expect-error TS(2307): Cannot find module '../files/filesystem.js' or its... Remove this comment to see the full error message
import * as filesystem from '../files/filesystem.js';
// @ts-expect-error TS(2307): Cannot find module '../files/filesystem.js' or its... Remove this comment to see the full error message
import { uploadsPath } from '../files/filesystem.js';
// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { search } from '../search.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.js' or its corresp... Remove this comment to see the full error message
import settings from '../settings.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import path from 'path';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';

// @ts-expect-error TS(2307): Cannot find module '../i18n.js' or its correspondi... Remove this comment to see the full error message
import translations from '../i18n.js';
import { CSVLoader } from '../csvLoader';
import { fixtures, template1Id } from './fixtures';
import { createTestingZip } from './helpers';

const removeTestingZip = async () =>
  filesystem.deleteFile(path.join(__dirname, 'zipData/testLanguages.zip'));

describe('csvLoader languages', () => {
  let imported: EntitySchema[];
  const loader = new CSVLoader();

  // eslint-disable-next-line max-statements
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await filesystem.setupTestUploadedPaths('csvLoader');
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());

    await settings.addLanguage({ key: 'es', label: 'Spanish' });
    await translations.addLanguage('es');

    await createTestingZip(
      [
        path.join(__dirname, 'zipData/languages/import.csv'),
        path.join(__dirname, '/zipData/1.pdf'),
        path.join(__dirname, '/zipData/2.pdf'),
        path.join(__dirname, '/zipData/file1.txt'),
        path.join(__dirname, '/zipData/att1.doc'),
      ],
      'testLanguages.zip'
    );

    const csv = path.join(__dirname, 'zipData/testLanguages.zip');
    jest
      .spyOn(filesystem, 'generateFileName')
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      .mockImplementation(file => `generatedLang${file.originalname}`);
    await loader.load(csv, template1Id, { language: 'en', user: {} });

    imported = await entities.get();
  });

  afterAll(async () => {
    // @ts-expect-error TS(7006): Parameter 'u' implicitly has an 'any' type.
    const generatedImages = (await files.get({})).map(u => u._id.toString());

    await filesystem.deleteFiles([
      uploadsPath('generatedLang1.pdf'),
      uploadsPath('generatedLang2.pdf'),
      uploadsPath('generatedLangfile1.txt'),
      uploadsPath('generatedLangatt1.doc'),
      uploadsPath(`${generatedImages[0]}.jpg`),
      uploadsPath(`${generatedImages[1]}.jpg`),
      uploadsPath(`${generatedImages[2]}.jpg`),
      uploadsPath(`${generatedImages[3]}.jpg`),
      uploadsPath(`${generatedImages[4]}.jpg`),
      uploadsPath(`${generatedImages[5]}.jpg`),
    ]);

    await removeTestingZip();
    await testingEnvironment.tearDown();
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
      .map(i => i?.metadata?.text_label?.[0].value);
    const esText = imported
      .filter(e => e.language === 'es')
      .map(i => i?.metadata?.text_label?.[0].value);
    expect(enText).toEqual(['text_en1', 'text_en2', 'text_en3']);
    expect(esText).toEqual(['text_es1', 'text_es2', 'text_es3']);
  });

  it('should import translated files', async () => {
    const importedFiles = await files.get({ type: 'document' });
    // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
    expect(importedFiles.map(f => f.filename)).toEqual([
      'generatedLang2.pdf',
      'generatedLang1.pdf',
    ]);

    expect(await filesystem.fileExistsOnPath(uploadsPath('generatedLang1.pdf'))).toBe(true);
    expect(await filesystem.fileExistsOnPath(uploadsPath('generatedLang2.pdf'))).toBe(true);
  });

  it('should import attachment files', async () => {
    const [{ attachments: enAttachments }] = await entities.get({
      language: 'en',
    });

    const [{ attachments: esAttachments }] = await entities.get({
      language: 'es',
    });

    expect(enAttachments).toEqual([
      expect.objectContaining({
        filename: 'generatedLangfile1.txt',
      }),
      expect.objectContaining({
        filename: 'generatedLangatt1.doc',
      }),
    ]);

    expect(esAttachments).toEqual([
      expect.objectContaining({
        filename: 'generatedLangfile1.txt',
      }),
      expect.objectContaining({
        filename: 'generatedLangatt1.doc',
      }),
    ]);
  });
});
