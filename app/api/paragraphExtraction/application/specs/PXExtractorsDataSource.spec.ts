import { ObjectId } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';

import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { mongoPXExtractorsCollection } from '#api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource.js';
import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';
import { MongoExtractorBuilder } from '#api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const otherSourceTemplate = MongoExtractorBuilder.factory.template('Other Source Template');

const entityStatus = {
  _id: MongoExtractorBuilder.factory.id('status'),
  entitySharedId: 'entity1',
  extractorId: extractor._id,
  status: EntityStatus.New,
};

const createFixtures = (): DBFixture => ({
  templates: [sourceTemplate, targetTemplate, otherSourceTemplate],
  relationtypes: [sourceRelationship, targetRelationship],
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [entityStatus],
});

const createSut = () =>
  testingEnvironment.runWithContext(() => {
    const connection = getConnection();
    const transactionManager = TransactionManagerFactory.default();

    return {
      sut: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager: transactionManager,
      }),
    };
  });

describe('PXExtractorsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingEnvironment.setFixtures(createFixtures());
    });

    it('should report whether an extractor exists for a source template', async () => {
      const { sut } = createSut();

      await expect(sut.exists({ sourceTemplateId: sourceTemplate._id!.toString() })).resolves.toBe(
        true
      );
      await expect(
        sut.exists({ sourceTemplateId: otherSourceTemplate._id!.toString() })
      ).resolves.toBe(false);
    });

    it('should load an extractor by source template', async () => {
      const { sut } = createSut();

      const loaded = await sut.getBySourceTemplate(sourceTemplate._id!.toString());

      expect(loaded).toMatchObject({
        id: extractor._id.toString(),
        sourceTemplate: { id: sourceTemplate._id!.toString() },
        targetTemplate: { id: targetTemplate._id!.toString() },
        sourceRelationshipTypeId: sourceRelationship._id.toString(),
        targetRelationshipTypeId: targetRelationship._id.toString(),
      });
    });

    it('should load an extractor by id', async () => {
      const { sut } = createSut();

      const loaded = await sut.getById(extractor._id.toString());

      expect(loaded).toMatchObject({
        id: extractor._id.toString(),
        sourceTemplate: { id: sourceTemplate._id!.toString() },
        targetTemplate: { id: targetTemplate._id!.toString() },
        paragraphNumberProperty: {
          id: extractor.paragraphNumberPropertyId.toString(),
        },
        paragraphProperty: { id: extractor.paragraphPropertyId.toString() },
      });
    });

    it('should return undefined for a missing extractor', async () => {
      const { sut } = createSut();

      await expect(sut.getById(new ObjectId().toString())).resolves.toBeUndefined();
    });

    it('should delete an extractor and its entity statuses', async () => {
      const { sut } = createSut();

      await sut.delete(extractor._id.toString());

      const extractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
      expect(extractors).toHaveLength(0);

      const statuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
      expect(statuses).toHaveLength(0);
    });

    it('should throw when deleting a missing extractor', async () => {
      const { sut } = createSut();

      await expect(sut.delete(new ObjectId().toString())).rejects.toMatchObject({
        code: PXValidationError.codes.CANNOT_DELETE_EXTRACTOR_THAT_DOES_NOT_EXIST,
      });
    });
  });
});
