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
import { tenants } from 'api/tenants';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { PXEntitiesStatusDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory';
import { TestUtils } from 'api/common.v2/utils/Test';

import { PXExtractParagraphsFromEntity } from '../PXExtractParagraphsFromEntity';
import {
  extractor,
  sourceTemplate,
  targetTemplate,
  defaultTemplate,
  entity,
  invalidEntity,
  segmentation,
  segmentation2,
  failedSegmentation,
  processingSegmentation,
  file,
  file2,
  files,
  fileWithLanguageNotInstalled,
  userId,
  entityStatus,
} from './fixtures';

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [entityStatus],
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
  files: [file, file2],
  segmentations: [segmentation, segmentation2],
});

const setUpUseCase = () => {
  const extractionService = {
    extractParagraphs: jest.fn(),
    getParagraphsResult: jest.fn(),
  };

  const fileStorage = {
    getFiles: jest.fn().mockResolvedValue(files),
    getFile: jest.fn(),
    getPath: jest.fn(),
    list: jest.fn(),
  };

  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();
  const entityDS = DefaultEntitiesDataSource(mongoTransactionManager);
  const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);
  const filesDS = DefaultFilesDataSource(mongoTransactionManager);
  const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);
  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const idGenerator = MongoIdHandler;
  const tenantName = tenants.current().name;

  const extractParagraphs = new PXExtractParagraphsFromEntity({
    entityDS,
    extractorsDS,
    filesDS,
    settingsDS,
    extractionService,
    fileStorage,
    entitiesStatusDS,
    idGenerator,
    logger: createMockLogger(),
    tenantName,
  });

  return {
    tenantName,
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

  it('should change Extraction status to "error" on fail', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: 'entity_shared_id_that_does_not_exist',
      extractorId: extractor._id.toString(),
      userId: userId.toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    await expect(promise).rejects.toThrow();

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(extractions).toMatchObject([
      {
        _id: entityStatus._id,
        status: EntityStatus.Error,
      },
    ]);
  });

  it("should fallback to the first document's language if no default language is present", async () => {
    await testingEnvironment.setFixtures({
      ...createFixtures(),
      files: [file2],
      segmentations: [segmentation2],
    });

    const { extractParagraphs, extractionService } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: userId.toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    const { mainLanguage } = extractionService.extractParagraphs.mock.lastCall[0];

    expect(mainLanguage).toBe('es');
  });

  it('should only extract Documents which language are installed on Settings collections', async () => {
    const fixtures = createFixtures();
    fixtures.files = [file, file2, fileWithLanguageNotInstalled];
    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs, extractionService } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    const [payload] = extractionService.extractParagraphs.mock.lastCall;

    expect(payload.documents).toMatchObject([{ language: 'en' }, { language: 'es' }]);
  });

  it('should only use Segmentation which have "ready" status', async () => {
    const fixtures = createFixtures();
    fixtures.files = [file];
    fixtures.segmentations = [segmentation, failedSegmentation, processingSegmentation];
    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs, extractionService } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    const [payload] = extractionService.extractParagraphs.mock.lastCall;

    expect(payload.segmentations).toMatchObject([
      {
        id: segmentation._id?.toString(),
        fileId: segmentation.fileID?.toString(),
        status: 'ready',
      },
    ]);
  });

  it('should use oldest Document if there are Documents with repeated languages', async () => {
    const getNextObjectId = (prevId: ObjectId, offsetSeconds: number = 10): ObjectId => {
      const prevTimestamp = prevId.getTimestamp().getTime() / 1000; // Convert to seconds
      const newTimestamp = prevTimestamp + offsetSeconds; // Add offset
      return new ObjectId(`${Math.floor(newTimestamp).toString(16)}0000000000000000`);
    };

    const file3 = {
      ...file2,
      _id: getNextObjectId(file2._id),
      filename: 'file_with_repeated_language',
      language: file2.language,
    };

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      files: [file, file2, file3],
      segmentations: [
        segmentation,
        segmentation2,
        { ...segmentation2, _id: new ObjectId(), fileID: file3._id },
      ],
    });

    const { extractParagraphs, extractionService } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    const [payload] = extractionService.extractParagraphs.mock.lastCall;

    expect(payload.documents.length).toBe(2);
    TestUtils.arrayContaining(payload.documents, [
      { id: file._id.toString() },
      { id: file2._id.toString() },
    ]);
  });

  it('should throw if Extractor does not exist', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!,
      extractorId: new ObjectId().toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
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
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.ENTITY_NOT_FOUND,
    });
  });

  it('should throw if Entity does not belong to the source template', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: invalidEntity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.ENTITY_INVALID, // rename to entity does not belong to the source template
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
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SEGMENTATIONS_UNAVAILABLE,
    });

    expect(extractionService.extractParagraphs).not.toHaveBeenCalled();
  });

  it('should throw if there is no Documents to be extracted', async () => {
    const fixtures = createFixtures();
    fixtures.files = [fileWithLanguageNotInstalled];

    await testingEnvironment.setFixtures(fixtures);

    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
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
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SEGMENTATION_FILES_NOT_FOUND,
    });
  });
});
