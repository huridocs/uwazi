import { ObjectId } from 'mongodb';

import { tenants } from 'api/tenants';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoPXExtractionsDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXExtractionsDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';

import {
  defaultTemplate,
  entity,
  entity2,
  extractor,
  file,
  file2,
  file3,
  files,
  invalidEntity,
  segmentation,
  segmentation2,
  segmentation3,
  sourceTemplate,
  targetTemplate,
} from './fixtures';
import { Input, PXExtractParagraphsFromEntities } from '../PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntity } from '../PXExtractParagraphsFromEntity';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate, defaultTemplate],
  entities: [entity, entity2, invalidEntity],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
  files: [file, file2, file3],
  segmentations: [segmentation, segmentation2, segmentation3],
});

// eslint-disable-next-line max-statements
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

  const db = getConnection();
  const transaction = DefaultTransactionManager();
  const entityDS = DefaultEntitiesDataSource(transaction);
  const settingsDS = DefaultSettingsDataSource(transaction);
  const filesDS = DefaultFilesDataSource(transaction);
  const extractorsDS = new MongoPXExtractorsDataSource(db, transaction);
  const extractionsDS = new MongoPXExtractionsDataSource(db, transaction);
  const idGenerator = MongoIdHandler;

  const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity({
    entityDS,
    extractorsDS,
    filesDS,
    settingsDS,
    extractionService,
    fileStorage,
    extractionsDS,
    idGenerator,
    logger: createMockLogger(),
  });

  const extractParagraphFromEntities = new PXExtractParagraphsFromEntities({
    extractParagraphsFromEntity,
  });

  return {
    extractionService,
    extractParagraphFromEntities,
  };
};

describe('PXExtractParagraphFromEntities', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should extract all Entities correctly', async () => {
    const { extractParagraphFromEntities, extractionService } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity.sharedId!, entity2.sharedId!],
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    expect(extractionService.extractParagraphs).toHaveBeenCalledTimes(2);

    const [firstPayload] = extractionService.extractParagraphs.mock.calls[0];

    const [secondPayload] = extractionService.extractParagraphs.mock.calls[1];

    expect(firstPayload).toMatchObject({
      documents: [
        { filename: file.filename, language: 'en' },
        { filename: file2.filename, language: 'es' },
      ],
      defaultLanguage: 'en',
      extractionId: {
        extractorId: extractor._id.toString(),
        entitySharedId: entity.sharedId,
        tenantName: input.tenantName,
        userId: input.userId,
      },
      files,
    });

    expect(secondPayload).toMatchObject({
      documents: [{ filename: file3.filename, language: 'es' }],
      defaultLanguage: 'en',
      extractionId: {
        extractorId: extractor._id.toString(),
        entitySharedId: entity2.sharedId,
        tenantName: input.tenantName,
        userId: input.userId,
      },
      files,
    });
  });
});
