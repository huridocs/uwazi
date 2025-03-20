import { ObjectId } from 'mongodb';

import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { MongoExtractorBuilder } from 'api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { PXEntitiesStatusDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory';

import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

import { PXCreateEntityStatus } from '../PXCreateEntityStatus';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const entity = MongoExtractorBuilder.factory.entity('source_entity', sourceTemplate.name);

const entityWithoutDocument = MongoExtractorBuilder.factory.entity(
  'entity_without_document',
  sourceTemplate.name
);

const entityDocumentInAnotherLanguage = MongoExtractorBuilder.factory.entity(
  'entity_document_in_another_language',
  sourceTemplate.name
);

const templateWithoutExtractor = MongoExtractorBuilder.factory.template(
  'template_without_extractor'
);

const entityWithoutExtractor = MongoExtractorBuilder.factory.entity(
  'entity_without_extractor',
  templateWithoutExtractor.name
);

const document = MongoExtractorBuilder.factory.document('document', {
  language: 'en',
  entity: entity.sharedId!,
});

const documentInAnotherLanguage = MongoExtractorBuilder.factory.document(
  'documentInAnotherLanguage',
  {
    language: 'pt',
    entity: entityDocumentInAnotherLanguage.sharedId!,
  }
);

const createFixtures = (): DBFixture => ({
  entities: [
    entity,
    entityWithoutExtractor,
    entityWithoutDocument,
    entityDocumentInAnotherLanguage,
  ],
  files: [document, documentInAnotherLanguage],
  relationtypes: [sourceRelationship, targetRelationship],
  templates: [sourceTemplate, targetTemplate, templateWithoutExtractor],
  [mongoPXExtractorsCollection]: [extractor],
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
});

const setUpUseCase = () => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();

  const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);
  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const filesDS = DefaultFilesDataSource(mongoTransactionManager);
  const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

  const createEntityStatus = new PXCreateEntityStatus({
    entitiesStatusDS,
    extractorsDS,
    filesDS,
    settingsDS,
  });

  return {
    createEntityStatus,
  };
};

describe('PXCreateEntityStatus', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a EntityStatus', async () => {
    const { createEntityStatus } = setUpUseCase();

    await createEntityStatus.execute({
      entitySharedId: entity.sharedId!,
      sourceTemplateId: entity.template!.toString(),
    });

    const entityStatuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
    const entities = await testingEnvironment.db.getAllFrom('entities');

    expect(entityStatuses).toMatchObject([
      {
        _id: expect.any(ObjectId),
        status: EntityStatus.New,
        extractorId: extractor._id,
        entitySharedId: entities![0].sharedId,
      },
    ]);
  });

  it('should do nothing if the created Entity does not have a template that match Extractor source template', async () => {
    const { createEntityStatus } = setUpUseCase();

    await createEntityStatus.execute({
      entitySharedId: entityWithoutExtractor.sharedId!,
      sourceTemplateId: entityWithoutExtractor.template!.toString(),
    });

    const entityStatuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entityStatuses?.length).toBe(0);
  });

  it('should do nothing if the created Entity does not have a Document with language that belongs to UI Language', async () => {
    const { createEntityStatus } = setUpUseCase();

    await createEntityStatus.execute({
      entitySharedId: entityDocumentInAnotherLanguage.sharedId!,
      sourceTemplateId: entityDocumentInAnotherLanguage.template!.toString(),
    });

    await createEntityStatus.execute({
      entitySharedId: entityWithoutDocument.sharedId!,
      sourceTemplateId: entityWithoutDocument.template!.toString(),
    });

    const entityStatuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entityStatuses?.length).toBe(0);
  });
});
