/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import relationshipTypeDS from 'api/relationtypes';
import { PXErrorCode } from 'api/paragraphExtraction/domain/PXValidationError';
import { DBFixture } from 'api/utils/testing_db';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { PXExtractorsDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory';

import { mongoPXExtractorsCollection } from '../../infrastructure/MongoPXExtractorsDataSource';
import { Input, PXCreateExtractor } from '../PXCreateExtractor';

const factory = getFixturesFactory();

type SetUpUseCaseProps = {
  entitiesStatusDS?: MongoPXEntitiesStatusDataSource;
};

const setUpUseCase = (props?: SetUpUseCaseProps) => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(mongoTransactionManager);
  const extractorDS = PXExtractorsDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const settingsDS = new MongoSettingsDataSource(connection, mongoTransactionManager);
  const entitiesStatusDS =
    props?.entitiesStatusDS ??
    new MongoPXEntitiesStatusDataSource(connection, mongoTransactionManager, settingsDS);

  return {
    createExtractor: new PXCreateExtractor({
      extractorDS,
      templatesDS,
      idGenerator: MongoIdHandler,
      relationshipTypeDS,
      transactionManager: mongoTransactionManager,
      entitiesStatusDS,
    }),
  };
};

const sourceTemplate = factory.template('Source Template', [factory.property('text', 'text')]);
const paragraphProperty = factory.property('paragraphProperty', 'markdown');
const paragraphNumberProperty = factory.property('paragraphNumberProperty', 'numeric');
const textProperty = factory.property('textProperty', 'text');

const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
]);

const invalidTargetTemplate = factory.template('Invalid Target');

const sourceRelationshipType = {
  _id: factory.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: factory.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const createFixtures = (): DBFixture => ({
  templates: [sourceTemplate, targetTemplate, invalidTargetTemplate],
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
});

const buildExtractorInput = (partialExtractor: Partial<Input> = {}) => ({
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

  it('should create EntityStatuses for each source entity that match Extractor configuration and have at least one Document of the UI language', async () => {
    const [entity1, entity1Es] = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity1',
      'Source Template'
    );

    const [entity2, entity2Es] = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity2',
      'Source Template'
    );

    const [entity3, entity3Es] = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_with_document_in_another_language',
      'Source Template'
    );

    const [entity4, entity4Es] = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_without_documents',
      'Source Template'
    );

    const document1 = factory.document('document', { entity: entity1.sharedId, language: 'en' });
    const document2 = factory.document('document2', { entity: entity2.sharedId, language: 'es' });
    const document3 = factory.document('document_in_another_language', {
      entity: entity3.sharedId,
      language: 'pt',
    });

    await testingEnvironment.setUp({
      ...createFixtures(),
      entities: [entity1, entity2, entity1Es, entity2Es, entity3, entity3Es, entity4, entity4Es],
      files: [document1, document2, document3],
    });

    const { createExtractor } = setUpUseCase();

    const extractor = await createExtractor.execute(buildExtractorInput());

    const mongoEntityStatuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    )) as MongoPXEntityStatusDBO[];

    expect(mongoEntityStatuses).toMatchObject([
      {
        status: EntityStatus.New,
        extractorId: new ObjectId(extractor.id),
        entitySharedId: entity1.sharedId,
      },
      {
        status: EntityStatus.New,
        extractorId: new ObjectId(extractor.id),
        entitySharedId: entity2.sharedId,
      },
    ]);
  });

  it('should revert Extractor creation if EntityStatus creation goes wrong', async () => {
    const entitiesStatusDS = {
      createForSourceEntities: jest.fn().mockRejectedValue(new Error('any_error')),
    } as any as MongoPXEntitiesStatusDataSource;

    const { createExtractor } = setUpUseCase({ entitiesStatusDS });

    await expect(createExtractor.execute(buildExtractorInput())).rejects.toThrow();

    const mongoEntityStatuses = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );
    const mongoExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(mongoEntityStatuses?.length).toBe(0);
    expect(mongoExtractors?.length).toBe(0);
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
        _id: factory.id('extractor'),
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
