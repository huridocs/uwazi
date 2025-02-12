/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { PXErrorCode } from 'api/paragraphExtraction/domain/PXValidationError';
import { DBFixture } from 'api/utils/testing_db';
import { PXExtractionService } from 'api/paragraphExtraction/domain/PXExtractionService';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Document } from 'api/files.v2/model/Document';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';

import { PXExtractParagraphsFromEntity } from '../PXExtractParagraphFromEntity';
import {
  extractor,
  sourceTemplate,
  targetTemplate,
  defaultTemplate,
  entity,
  invalidEntity,
  file2,
  fileWithLanguageNotConfigured,
  segmentation,
  segmentation2,
  fileWithLanguageNotConfiguredSegmentation,
  failedSegmentation,
  processingSegmentation,
  file,
  files,
} from './fixtures';

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate, defaultTemplate],
  entities: [entity, invalidEntity],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
  files: [file, file2, fileWithLanguageNotConfigured],
  segmentations: [segmentation, segmentation2, fileWithLanguageNotConfiguredSegmentation],
});

const setUpUseCase = () => {
  const extractionService: PXExtractionService = {
    extractParagraph: jest.fn(),
  };

  const fileStorage: FileStorage = {
    getFiles: jest.fn().mockResolvedValue(files),
    getFile: jest.fn(),
    getPath: jest.fn(),
    list: jest.fn(),
  };

  const db = getConnection();
  const transaction = DefaultTransactionManager();
  const entityDS = DefaultEntitiesDataSource(transaction);
  const settingsDS = DefaultSettingsDataSource(transaction);
  const filesDS = DefaultFilesDataSource(transaction);
  const extractorsDS = new MongoPXExtractorsDataSource(db, transaction);

  const extractParagraphs = new PXExtractParagraphsFromEntity({
    entityDS,
    extractorsDS,
    filesDS,
    settingsDS,
    extractionService,
    fileStorage,
  });

  return {
    extractionService,
    fileStorage,
    extractParagraphs,
  };
};

describe('PXExtractParagraphsFromEntity', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw if Extractor does not exist', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!,
      extractorId: new ObjectId().toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.EXTRACTOR_NOT_FOUND,
    });
  });

  it('should throw if Entity does not exist', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: new ObjectId().toString(),
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.ENTITY_NOT_FOUND,
    });
  });

  it('should throw if Entity is not valid for the Extractor', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: invalidEntity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.ENTITY_INVALID,
    });
  });

  it('should throw if any of the Documents do not have Segmentations', async () => {
    const fixtures = createFixtures();
    fixtures.segmentations = [segmentation];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs, extractionService } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SEGMENTATIONS_UNAVAILABLE,
    });

    expect(extractionService.extractParagraph).not.toHaveBeenCalled();
  });

  it('should throw if no documents are found for the entity', async () => {
    const fixtures = createFixtures();
    fixtures.files = [];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.DOCUMENTS_NOT_FOUND,
    });
  });

  it('should throw if there is no Segmentation Files to send', async () => {
    const { extractParagraphs, fileStorage } = setUpUseCase();

    fileStorage.getFiles = jest.fn().mockResolvedValue(() => []);

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SEGMENTATION_FILES_NOT_FOUND,
    });
  });

  it('should throw if no valid segmentations are found', async () => {
    const fixtures = createFixtures();
    fixtures.segmentations = [failedSegmentation, processingSegmentation];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SEGMENTATIONS_UNAVAILABLE,
    });
  });

  it('should throw if no installed languages are found', async () => {
    const fixtures = createFixtures();
    fixtures.settings = [];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.LANGUAGES_NOT_FOUND,
    });
  });

  it('should call extract paragraph service with correct params', async () => {
    const { extractParagraphs, extractionService, fileStorage } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    expect(fileStorage.getFiles).toHaveBeenCalledWith([
      {
        type: 'segmentation',
        filename: segmentation.xmlname,
      },
      {
        type: 'segmentation',
        filename: segmentation2.xmlname,
      },
    ]);

    expect(extractionService.extractParagraph).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: expect.arrayContaining([expect.any(Document)]),
        defaultLanguage: expect.any(String),
        extractionId: expect.any(PXExtractionId),
        segmentations: [
          {
            id: segmentation._id?.toString(),
            fileId: segmentation.fileID?.toString(),
            status: 'ready',
            pageHeight: 0,
            pageWidth: 0,
            paragraphs: [],
            xmlname: 'default.txt',
          },
          {
            id: segmentation2._id?.toString(),
            fileId: segmentation2.fileID?.toString(),
            status: 'ready',
            pageHeight: 0,
            pageWidth: 0,
            paragraphs: [],
            xmlname: 'default.txt',
          },
        ],
        files,
      })
    );
  });

  it('should only work with valid Segmentations', async () => {
    const fixtures = createFixtures();
    fixtures.segmentations = [segmentation, failedSegmentation, processingSegmentation];
    fixtures.files = [file];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs, extractionService } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
    });

    expect(extractionService.extractParagraph).toHaveBeenCalledWith({
      documents: expect.arrayContaining([expect.any(Document)]),
      defaultLanguage: expect.any(String),
      extractionId: expect.any(PXExtractionId),
      segmentations: [
        {
          id: segmentation._id?.toString(),
          fileId: segmentation.fileID?.toString(),
          status: 'ready',
          pageHeight: 0,
          pageWidth: 0,
          paragraphs: [],
          xmlname: 'default.txt',
        },
      ],
      files,
    });
  });
});
