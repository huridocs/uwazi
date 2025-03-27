import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatus } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatus';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { MongoExtractorBuilder } from 'api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { PXDeleteExtractor } from '../PXDeleteExtractor';
import { PXValidationError } from 'api/paragraphExtraction/domain/PXValidationError';

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

const mongoEntityStatus1: MongoPXEntityStatus = {
  _id: factory.id('entity_status_1'),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const mongoEntityStatus2: MongoPXEntityStatus = {
  _id: factory.id('entity_status_2'),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const mongoEntityStatus3: MongoPXEntityStatus = {
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
  const db = getConnection();
  const transaction = DefaultTransactionManager();
  const extractorsDS = new MongoPXExtractorsDataSource(db, transaction);

  const deleteExtractor = new PXDeleteExtractor({
    extractorsDS,
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

    await deleteExtractor.execute({ extractorId: extractor._id.toString() });

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

    const promise = deleteExtractor.execute({ extractorId: new ObjectId().toString() });

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
