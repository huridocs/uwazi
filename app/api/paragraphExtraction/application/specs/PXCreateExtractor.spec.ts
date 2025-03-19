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
import { MongoPXEntityStatus } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatus';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { TestUtils } from 'api/common.v2/utils/Test';

import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from '../../infrastructure/MongoPXExtractorsDataSource';
import { PXCreateExtractor } from '../PXCreateExtractor';

const factory = getFixturesFactory();

type SetUpUseCaseProps = {
  entitiesStatusDS?: MongoPXEntitiesStatusDataSource;
};

const setUpUseCase = (props?: SetUpUseCaseProps) => {
  const connection = getConnection();
  const transactionManager = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const extractorDS = new MongoPXExtractorsDataSource(connection, transactionManager);
  const settingsDS = new MongoSettingsDataSource(connection, transactionManager);
  const entitiesStatusDS =
    props?.entitiesStatusDS ??
    new MongoPXEntitiesStatusDataSource(connection, transactionManager, settingsDS);

  return {
    createExtractor: new PXCreateExtractor({
      extractorDS,
      templatesDS,
      idGenerator: MongoIdHandler,
      relationshipTypeDS,
      transactionManager,
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

describe('PXCreateExtractor', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Extractor correctly', async () => {
    const { createExtractor } = setUpUseCase();

    await createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

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

    const extractor = await createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    const mongoEntityStatuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    )) as MongoPXEntityStatus[];

    expect(mongoEntityStatuses.length).toBe(2);

    TestUtils.arrayContaining(mongoEntityStatuses, [
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

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toThrow();

    const mongoEntityStatuses = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );
    const mongoExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(mongoEntityStatuses?.length).toBe(0);
    expect(mongoExtractors?.length).toBe(0);
  });

  it('should throw if source relationship type does not exist', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: new ObjectId().toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SOURCE_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
    });
  });

  it('should throw if target relationship type does not exist', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      targetRelationshipTypeId: new ObjectId().toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.TARGET_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
    });
  });

  it('should throw if the paragraph Property does not exist on Template', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: new ObjectId().toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_PROPERTY_DOES_NOT_EXIST,
    });
  });

  it('should throw if the paragraph Property is not of the rich text type', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: textProperty._id!.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_PROPERTY_IS_NOT_OF_RICH_TEXT,
    });
  });

  it('should throw if the paragraph number Property does not exist on Template', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      paragraphNumberPropertyId: new ObjectId().toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_DOES_NOT_EXIST,
    });
  });

  it('should throw if the paragraph number Property is not of the number type', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      paragraphNumberPropertyId: textProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_IS_NOT_A_NUMBER,
    });
  });

  it('should throw if target Template does not exist', async () => {
    const { createExtractor } = setUpUseCase();
    const targetTemplateId = new ObjectId().toString();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId,
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.TARGET_TEMPLATE_NOT_FOUND,
    });
  });

  it('should throw if source Template does not exist', async () => {
    const { createExtractor } = setUpUseCase();
    const sourceTemplateId = new ObjectId().toString();

    const promise = createExtractor.execute({
      targetTemplateId: sourceTemplate._id.toString(),
      sourceTemplateId,
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SOURCE_TEMPLATE_NOT_FOUND,
    });
  });

  it('should throw if target and source template are the same', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: targetTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.TARGET_SOURCE_TEMPLATE_EQUAL,
    });

    const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
    expect(dbPXExtractors).toEqual([]);
  });
});
