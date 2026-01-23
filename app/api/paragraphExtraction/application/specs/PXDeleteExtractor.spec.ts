import { ObjectId } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';

import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';

import { MongoPXEntityStatusDBO } from '#api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';

import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';

import { mongoPXExtractorsCollection } from '#api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource.js';

import { MongoExtractorBuilder } from '#api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder.js';

import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';

import { DBFixture } from '#api/utils/testing_db.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { PXDeleteExtractor } from '#api/paragraphExtraction/application/PXDeleteExtractor.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const sourceTemplate2 = factory.template('source_template_2');

const { extractor: extractor2 } = MongoExtractorBuilder.create()
  .withSourceTemplate(sourceTemplate2)
  .withTargetTemplate(targetTemplate)
  .withSourceRelationship(sourceRelationship)
  .withTargetRelationship(targetRelationship)
  .build();

const mongoEntityStatus1: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_1'),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const mongoEntityStatus2: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_2'),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const mongoEntityStatus3: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_with_different_extractor'),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor2._id,
  status: EntityStatus.Processed,
};

const createFixtures = (): DBFixture => ({
  templates: [targetTemplate, sourceTemplate],
  [mongoPXExtractorsCollection]: [extractor, extractor2],
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus1, mongoEntityStatus2, mongoEntityStatus3],
  relationtypes: [sourceRelationship, targetRelationship],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
});

const setUpUseCase = () => {
  const connection = getConnection();
  const mongoTransactionManager = TransactionManagerFactory.default();
  const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });

  const deleteExtractor = new PXDeleteExtractor({
    extractorsDS,
    transactionManager: mongoTransactionManager,
  });

  return {
    deleteExtractor,
  };
};

describe('PXDeleteExtractor', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete an Extractor along with its EntityStatus', async () => {
    const { deleteExtractor } = setUpUseCase();

    await deleteExtractor.execute({ id: extractor._id.toString() });

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    const mongoExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(mongoExtractors).toHaveLength(1);
    expect(mongoExtractors).toMatchObject([extractor2]);

    expect(mongoEntitiesStatus).toHaveLength(1);
    expect(mongoEntitiesStatus).toMatchObject([mongoEntityStatus3]);
  });

  it('should throw if the Extractor does not exist', async () => {
    const { deleteExtractor } = setUpUseCase();

    const promise = deleteExtractor.execute({ id: new ObjectId().toString() });

    await expect(promise).rejects.toMatchObject({
      code: PXValidationError.codes.CANNOT_DELETE_EXTRACTOR_THAT_DOES_NOT_EXIST,
    });

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    const mongoExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(mongoExtractors).toHaveLength(2);
    expect(mongoEntitiesStatus).toHaveLength(3);
  });
});
