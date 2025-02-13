import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { PXValidationError } from 'api/paragraphExtraction/domain/PXValidationError';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';
import { DBFixture } from 'api/utils/testing_db';

import { PXCreateParagraph } from '../PXCreateParagraph';
import { extractor, sourceTemplate, targetTemplate, defaultTemplate, entity } from './fixtures';

const setUpUseCase = () => {
  const db = getConnection();
  const transaction = DefaultTransactionManager();
  const entityDS = DefaultEntitiesDataSource(transaction);
  const extractorsDS = new MongoPXExtractorsDataSource(db, transaction);

  const createParagraph = new PXCreateParagraph({
    entityDS,
    extractorsDS,
    idGenerator: MongoIdHandler,
  });

  return {
    createParagraph,
  };
};

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate, defaultTemplate],
  entities: [entity],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
});

describe('PXCreateParagraph', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw if extractionId is invalid', async () => {
    const { createParagraph } = setUpUseCase();

    const promise = createParagraph.execute({
      language: 'ab',
      text: 'Extracted text',
      pageNumber: 1,
      extractionId: 'invalid extractor id',
    });

    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        name: PXValidationError.name,
        code: PXValidationError.codes.EXTRACTION_ID_INVALID,
      })
    );
  });

  it('should throw if Extractor was not found', async () => {
    const fixtures = createFixtures();
    fixtures[mongoPXExtractorsCollection] = [];
    await testingEnvironment.setFixtures(fixtures);

    const { createParagraph } = setUpUseCase();
    const extractionId = PXExtractionId.create({
      entitySharedId: entity.sharedId!.toString(),
      extractorId: extractor._id.toString(),
    }).id;

    const promise = createParagraph.execute({
      language: 'ab',
      text: 'Extracted text',
      pageNumber: 1,
      extractionId,
    });

    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        name: PXValidationError.name,
        code: PXValidationError.codes.EXTRACTOR_NOT_FOUND,
      })
    );
  });

  it('should throw if Source Entity was not found', async () => {
    const fixtures = createFixtures();
    fixtures.entities = [];
    await testingEnvironment.setFixtures(fixtures);

    const { createParagraph } = setUpUseCase();

    const extractionId = PXExtractionId.create({
      entitySharedId: entity.sharedId!.toString(),
      extractorId: extractor._id.toString(),
    }).id;

    const promise = createParagraph.execute({
      language: 'ab',
      text: 'Extracted text',
      pageNumber: 1,
      extractionId,
    });

    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        name: PXValidationError.name,
        code: PXValidationError.codes.ENTITY_NOT_FOUND,
      })
    );
  });
});
