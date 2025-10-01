/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import relationshipTypeDS from 'api/relationtypes';
import { PXErrorCode } from 'api/paragraphExtraction/domain/PXValidationError';
import { DBFixture } from 'api/utils/testing_db';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { PXExtractorsDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';

import { CreateParagraphExtractionEntityStatusesJob } from '../../jobs/CreateParagraphExtractionEntityStatusesJob';
import { mongoPXExtractorsCollection } from '../../infrastructure/MongoPXExtractorsDataSource';
import { Input, PXCreateExtractor } from '../PXCreateExtractor';

const f = getFixturesFactory();

const setUpUseCase = () => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(mongoTransactionManager);
  const extractorDS = PXExtractorsDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });

  const mockDispatcher: jest.Mocked<JobsDispatcher> = {
    dispatch: jest.fn().mockResolvedValue(undefined),
  };

  const createExtractor = new PXCreateExtractor({
    extractorDS,
    templatesDS,
    idGenerator: MongoIdHandler,
    relationshipTypeDS,
    transactionManager: mongoTransactionManager,
    dispatcher: mockDispatcher,
  });

  return {
    createExtractor,
    mockDispatcher,
    connection,
  };
};

const sourceTemplate = f.template('Source Template', [f.property('text', 'text')]);
const paragraphProperty = f.property('paragraphProperty', 'markdown');
const paragraphNumberProperty = f.property('paragraphNumberProperty', 'numeric');
const textProperty = f.property('textProperty', 'text');

const targetTemplate = f.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
]);

const invalidTargetTemplate = f.template('Invalid Target');

const sourceRelationshipType = {
  _id: f.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: f.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const nonRelevantRelationshipType = {
  _id: f.id('nonRelevantRelationshipType'),
  name: 'Other Relationship Type',
  properties: [],
};

const createFixtures = (): DBFixture => ({
  templates: [sourceTemplate, targetTemplate, invalidTargetTemplate],
  relationtypes: [sourceRelationshipType, targetRelationshipType, nonRelevantRelationshipType],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
});

const buildExtractorInput = (partialExtractor: Partial<Input> = {}): Input => ({
  sourceTemplateId: sourceTemplate._id.toString(),
  targetTemplateId: targetTemplate._id.toString(),
  paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
  paragraphPropertyId: paragraphProperty._id!.toString(),
  sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
  targetRelationshipTypeId: targetRelationshipType._id.toString(),
  ...partialExtractor,
});

describe('PXCreateExtractor', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Extractor correctly', async () => {
    const { createExtractor } = setUpUseCase();

    await createExtractor.execute(buildExtractorInput());

    const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(dbPXExtractors).toEqual([
      {
        _id: expect.any(ObjectId),
        sourceTemplateId: sourceTemplate._id,
        targetTemplateId: targetTemplate._id,
        paragraphPropertyId: paragraphProperty._id,
        paragraphNumberPropertyId: paragraphNumberProperty._id,
        sourceRelationshipTypeId: sourceRelationshipType._id,
        targetRelationshipTypeId: targetRelationshipType._id,
      },
    ]);
  });

  it('should dispatch a job to create entity statuses', async () => {
    const { createExtractor, mockDispatcher } = setUpUseCase();
    const extractor = await createExtractor.execute(buildExtractorInput());

    expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
      CreateParagraphExtractionEntityStatusesJob,
      {
        extractorId: extractor.id,
        sourceTemplateId: sourceTemplate._id.toString(),
      }
    );
  });

  describe('Validations', () => {
    let createExtractor: PXCreateExtractor;
    beforeAll(async () => {
      createExtractor = setUpUseCase().createExtractor;
    });
    it.each([
      {
        reason: 'source relationship type does not exist',
        input: buildExtractorInput({ sourceRelationshipTypeId: new ObjectId().toString() }),
        errorCode: PXErrorCode.SOURCE_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
      },
      {
        reason: 'target relationship type does not exist',
        input: buildExtractorInput({ targetRelationshipTypeId: new ObjectId().toString() }),
        errorCode: PXErrorCode.TARGET_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
      },
      {
        reason: 'paragraph property does not exist on Template',
        input: buildExtractorInput({ paragraphPropertyId: new ObjectId().toString() }),
        errorCode: PXErrorCode.PARAGRAPH_PROPERTY_DOES_NOT_EXIST,
      },
      {
        reason: 'paragrapth Property is not of the rich text type',
        input: buildExtractorInput({ paragraphPropertyId: textProperty._id!.toString() }),
        errorCode: PXErrorCode.PARAGRAPH_PROPERTY_IS_NOT_OF_RICH_TEXT,
      },
      {
        reason: 'the paragrapth number Property does not exist on Template',
        input: buildExtractorInput({ paragraphNumberPropertyId: new ObjectId().toString() }),
        errorCode: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_DOES_NOT_EXIST,
      },
      {
        reason: 'the paragrapth number Property is not of the number type',
        input: buildExtractorInput({ paragraphNumberPropertyId: textProperty._id!.toString() }),
        errorCode: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_IS_NOT_A_NUMBER,
      },
      {
        reason: 'target Template does not exist',
        input: buildExtractorInput({ targetTemplateId: new ObjectId().toString() }),
        errorCode: PXErrorCode.TARGET_TEMPLATE_NOT_FOUND,
      },
      {
        reason: 'source Template does not exist',
        input: buildExtractorInput({ sourceTemplateId: new ObjectId().toString() }),
        errorCode: PXErrorCode.SOURCE_TEMPLATE_NOT_FOUND,
      },
      {
        reason: 'target and source template are the same',
        input: buildExtractorInput({
          sourceTemplateId: targetTemplate._id.toString(),
          targetTemplateId: targetTemplate._id.toString(),
        }),
        errorCode: PXErrorCode.TARGET_SOURCE_TEMPLATE_EQUAL,
      },
      {
        reason: 'target and source relationship types are the same',
        input: buildExtractorInput({
          sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
          targetRelationshipTypeId: sourceRelationshipType._id.toString(),
        }),
        errorCode: PXErrorCode.SAME_SOURCE_TARGET_RELATIONTYPE,
      },
    ])('should throw if $reason', async ({ input, errorCode }) => {
      await expect(createExtractor.execute(input)).rejects.toMatchObject({ code: errorCode });
      const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
      expect(dbPXExtractors).toEqual([]);
    });

    it('should throw if source template is used by another Extractor', async () => {
      const extractor: MongoPXExtractorDBO = {
        _id: f.id('extractor'),
        sourceTemplateId: sourceTemplate._id,
        targetTemplateId: new ObjectId(),
        paragraphPropertyId: new ObjectId(),
        paragraphNumberPropertyId: new ObjectId(),
        sourceRelationshipTypeId: new ObjectId(),
        targetRelationshipTypeId: new ObjectId(),
      };
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXExtractorsCollection]: [extractor],
      });

      const promise = createExtractor.execute(buildExtractorInput());

      await expect(promise).rejects.toMatchObject({
        code: PXErrorCode.EXTRACTOR_ALREADY_EXISTS,
      });

      const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
      expect(dbPXExtractors).toEqual([extractor]);
    });
  });
});
