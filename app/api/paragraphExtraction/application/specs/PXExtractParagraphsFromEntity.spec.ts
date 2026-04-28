/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { PXErrorCode } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { mongoPXExtractorsCollection } from '#api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';
import { tenants } from '#api/tenants/index.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { PXExtractParagraphsFromEntity } from '../PXExtractParagraphsFromEntity.js';
import {
  defaultTemplate,
  entity1,
  entity2,
  entity3,
  entityStatus1,
  extractor,
  failedSegmentation,
  file,
  file2,
  fileWithLanguageNotInstalled,
  invalidEntity,
  paragraph1,
  paragraph2,
  paragraph3,
  paragraph4,
  paragraph5,
  processingSegmentation,
  relationshipE1Hub1,
  relationshipE1Hub3,
  relationshipE2Hub1,
  relationshipE2Hub2,
  relationshipP1Hub1,
  relationshipP1Hub1Repeated,
  relationshipP2Hub1,
  relationshipP3Hub3,
  relationshipP4Hub1,
  relationshipP5Hub2,
  segmentation,
  segmentation2,
  sourceTemplate,
  targetTemplate,
  userId,
} from './fixtures.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { User } from '#api/users.v2/model/User.js';

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [entityStatus1],
  templates: [sourceTemplate, targetTemplate, defaultTemplate],
  entities: [entity1, invalidEntity],
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

  const fileStorage = TestUtils.mockClass<FileStorage>({
    getFile: jest.fn(),
  });

  const connection = getConnection();
  const mongoTransactionManager = TransactionManagerFactory.default();
  const entitiesDS = EntitiesDataSourceFactory.forTesting(mongoTransactionManager);
  const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
  const filesDS = FilesDataSourceFactory.default();

  const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });

  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const idGenerator = MongoIdHandler;
  const tenantName = tenants.current().name;

  const entitiesService = EntitiesServiceFactory.default({
    transactionManager: mongoTransactionManager,
  });

  const extractParagraphs = new PXExtractParagraphsFromEntity(
    {
      transactionManager: mongoTransactionManager,
      entitiesService,
      entitiesDS,
      extractorsDS,
      filesDS,
      settingsDS,
      extractionService,
      fileStorage,
      entitiesStatusDS,
      idGenerator,
      logger: createMockLogger(),
      tenantName,
    },
    { tenant: tenants.current(), actor: User.createFrom(permissionsContext.getUserInContext()!) }
  );

  return {
    tenantName,
    extractionService,
    fileStorage,
    extractParagraphs,
  };
};

describe('PXExtractParagraphsFromEntity', () => {
  beforeAll(async () =>
    testingEnvironment.setUp(createFixtures(), 'px_extract_paragraphs_from_entity')
  );

  beforeEach(async () => {
    await testingEnvironment.setFixtures(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should change Extraction status to "error" on fail if use case is not going to be retried again', async () => {
    const { extractParagraphs } = setUpUseCase();

    await expect(
      extractParagraphs.execute(
        {
          entitySharedId: 'entity_shared_id_that_does_not_exist',
          extractorId: extractor._id.toString(),
          userId: userId.toString(),
          entityStatusId: entityStatus1._id.toString(),
        },
        true
      )
    ).rejects.toThrow();

    const entitiesStatus1 = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entitiesStatus1).toMatchObject([
      {
        _id: entityStatus1._id,
        status: EntityStatus.Processing,
      },
    ]);

    await expect(
      extractParagraphs.execute(
        {
          entitySharedId: 'entity_shared_id_that_does_not_exist',
          extractorId: extractor._id.toString(),
          userId: userId.toString(),
          entityStatusId: entityStatus1._id.toString(),
        },
        false
      )
    ).rejects.toThrow();

    const entitiesStatus2 = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entitiesStatus2).toMatchObject([
      {
        _id: entityStatus1._id,
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: userId.toString(),
      entityStatusId: entityStatus1._id.toString(),
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
    });

    const [payload] = extractionService.extractParagraphs.mock.lastCall;

    expect(payload.documents).toMatchObject([
      { id: file._id.toString() },
      { id: file2._id.toString() },
    ]);
  });

  it('should delete previous created Paragraphs before extracting new ones', async () => {
    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [
        entity1,
        entity2,
        entity3,
        paragraph1,
        paragraph2,
        paragraph3,
        paragraph4,
        paragraph5,
      ],
      connections: [
        relationshipE1Hub1,
        relationshipE1Hub3,

        relationshipP1Hub1,
        relationshipP1Hub1Repeated,
        relationshipP2Hub1,
        relationshipP3Hub3,

        relationshipE2Hub1,
        relationshipE2Hub2,

        relationshipP4Hub1,
        relationshipP5Hub2,
      ],
    });

    const { extractParagraphs } = setUpUseCase();

    await extractParagraphs.execute({
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
    });

    const entities = await testingEnvironment.db.getAllFrom('entities');

    // Entities (paragraphs) should be deleted synchronously
    expect(entities).toMatchObject([entity1, entity2, entity3, paragraph4, paragraph5]);

    // Note: Connections are deleted asynchronously via BulkCleanupEntityJob,
    // so they won't be deleted immediately after execute() returns
  });

  it('should throw if Extractor does not exist', async () => {
    const { extractParagraphs } = setUpUseCase();

    const promise = extractParagraphs.execute({
      entitySharedId: entity1.sharedId!,
      extractorId: new ObjectId().toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
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
      entityStatusId: entityStatus1._id.toString(),
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
      entityStatusId: entityStatus1._id.toString(),
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
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
      entitySharedId: entity1.sharedId!.toString()!,
      extractorId: extractor._id.toString(),
      userId: new ObjectId().toString(),
      entityStatusId: entityStatus1._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.DOCUMENTS_NOT_FOUND,
    });
  });
});
