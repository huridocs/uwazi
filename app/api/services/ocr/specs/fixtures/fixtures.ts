import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { OcrStatus } from '../../ocrModel';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  entities: [
    fixturesFactory.entity('parentEntity'),
    fixturesFactory.entity('parentForExistingRecord'),
  ],
  files: [
    fixturesFactory.file(
      'unrelatedAttachment',
      'parentEntity',
      'attachment',
      'unrelatedAttachment.pdf',
      'eng'
    ),
    {
      ...fixturesFactory.file(
        'sourceFile',
        'parentEntity',
        'document',
        'sourceFileName.pdf',
        'eng'
      ),
      originalname: 'sourceFileOriginalName.pdf',
    },
    {
      ...fixturesFactory.file(
        'erroringSourceFile',
        'parentEntity',
        'document',
        'errorSourceFileName.pdf',
        'notALanguage'
      ),
    },
    fixturesFactory.file(
      'resultForExistingRecord',
      'parentForExistingRecord',
      'document',
      'ocr_existingFileName.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'sourceForExistingRecord',
      'parentForExistingRecord',
      'attachment',
      'existingFileName.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'resultToDelete',
      'parentForExistingRecord',
      'document',
      'ocr_toDeleteFileName.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'sourceToDelete',
      'parentForExistingRecord',
      'attachment',
      'toDeleteFileName.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'resultToDelete2',
      'parentForExistingRecord',
      'document',
      'ocr_toDeleteFileName2.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'sourceToDelete2',
      'parentForExistingRecord',
      'attachment',
      'toDeleteFileName.pdf2',
      'eng'
    ),
  ],
  ocr_records: [
    {
      sourceFile: fixturesFactory.id('sourceForExistingRecord'),
      resultFile: fixturesFactory.id('resultForExistingRecord'),
      language: 'en',
      status: OcrStatus.READY,
      lastUpdated: 1000,
    },
    {
      sourceFile: fixturesFactory.id('sourceToDelete'),
      resultFile: fixturesFactory.id('resultToDelete'),
      language: 'en',
      status: OcrStatus.READY,
    },
    {
      sourceFile: fixturesFactory.id('sourceToDelete2'),
      resultFile: fixturesFactory.id('resultToDelete2'),
      language: 'en',
      status: OcrStatus.READY,
    },
  ],
  settings: [
    {
      features: {
        ocr: {
          url: 'serviceUrl',
        },
      },
    },
  ],
};

export { fixtures, fixturesFactory };
