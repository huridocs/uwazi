import { ObjectId } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { MongoPXEntityStatusDBO } from '#api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';

const f = getFixturesFactory();

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const extractorId = f.id('extractor');
const entitySharedId = 'entity1';

const entityStatus: MongoPXEntityStatusDBO = {
  _id: f.id('status'),
  entitySharedId,
  extractorId,
  status: EntityStatus.New,
};

const secondExtractorId = f.id('extractor2');
const secondEntityStatus: MongoPXEntityStatusDBO = {
  _id: f.id('status2'),
  entitySharedId,
  extractorId: secondExtractorId,
  status: EntityStatus.New,
};

const createFixtures = (): DBFixture => ({
  [mongoPXEntitiesStatusCollection]: [entityStatus],
});

const createSut = () =>
  testingEnvironment.runWithContext(() => {
    const connection = getConnection();
    const transactionManager = TransactionManagerFactory.default();

    return {
      sut: PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager: transactionManager,
      }),
    };
  });

const statuses = async () => testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

describe('PXEntitiesStatusDataSource', () => {
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

    describe('createWithStatus', () => {
      it('should create an EntityStatus and return its model', async () => {
        const { sut } = createSut();

        const created = await sut.createWithStatus({
          entitySharedId: 'entity2',
          extractorId: extractorId.toString(),
          status: EntityStatus.New,
        });

        expect(created).toMatchObject({
          id: expect.any(String),
          entitySharedId: 'entity2',
          extractorId: extractorId.toString(),
          status: EntityStatus.New,
        });

        expect(await statuses()).toHaveLength(2);
      });

      it('should not create an EntityStatus if one already exists', async () => {
        // Production Mongo enforces this via migration 171's unique index, which the test
        // environment does not apply automatically; Postgres enforces it via the schema.
        await testingEnvironment.db.getCollection(mongoPXEntitiesStatusCollection)?.createIndex(
          {
            extractorId: 1,
            entitySharedId: 1,
          },
          { unique: true }
        );

        const { sut } = createSut();

        await expect(
          sut.createWithStatus({
            entitySharedId: entityStatus.entitySharedId,
            extractorId: entityStatus.extractorId.toString(),
            status: EntityStatus.New,
          })
        ).rejects.toMatchObject({
          code: PXValidationError.codes.CANNOT_CREATE_ENTITY_STATUS,
        });
      });
    });

    describe('reads', () => {
      it('should get an EntityStatus by id', async () => {
        const { sut } = createSut();

        const found = await sut.getById(entityStatus._id.toString());

        expect(found).toMatchObject({
          id: entityStatus._id.toString(),
          entitySharedId,
          extractorId: extractorId.toString(),
          status: EntityStatus.New,
        });
      });

      it('should return undefined when getting a missing EntityStatus', async () => {
        const { sut } = createSut();

        await expect(sut.getById(new ObjectId().toString())).resolves.toBeUndefined();
      });

      it('should get an existing EntityStatus by extractor and entity', async () => {
        const { sut } = createSut();

        const found = await sut.getExisting({
          entitySharedId,
          extractorId: extractorId.toString(),
        });

        expect(found).toMatchObject({
          id: entityStatus._id.toString(),
          entitySharedId,
          extractorId: extractorId.toString(),
        });
      });
    });

    describe('markAsError and markAsProcessing', () => {
      it('should mark an EntityStatus as error', async () => {
        const { sut } = createSut();

        await sut.markAsError(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.Error }]);
      });

      it('should throw when marking a missing EntityStatus as error', async () => {
        const { sut } = createSut();

        await expect(sut.markAsError(new ObjectId().toString())).rejects.toThrow();
      });

      it('should mark an EntityStatus as processing', async () => {
        const { sut } = createSut();

        await sut.markAsProcessing(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.Processing }]);
      });

      it('should throw when marking a missing EntityStatus as processing', async () => {
        const { sut } = createSut();

        await expect(sut.markAsProcessing(new ObjectId().toString())).rejects.toThrow();
      });
    });

    describe('markAsObsolete', () => {
      it('should keep a New status unchanged', async () => {
        const { sut } = createSut();

        await sut.markAsObsolete(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.New }]);
      });

      it('should mark a Processing status as processing_obsolete', async () => {
        await testingEnvironment.setFixtures({
          ...createFixtures(),
          [mongoPXEntitiesStatusCollection]: [{ ...entityStatus, status: EntityStatus.Processing }],
        });
        const { sut } = createSut();

        await sut.markAsObsolete(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.ProcessingObsolete }]);
      });

      it('should mark a Processed status as obsolete', async () => {
        await testingEnvironment.setFixtures({
          ...createFixtures(),
          [mongoPXEntitiesStatusCollection]: [{ ...entityStatus, status: EntityStatus.Processed }],
        });
        const { sut } = createSut();

        await sut.markAsObsolete(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.Obsolete }]);
      });
    });

    describe('markAsProcessed', () => {
      it('should mark a processing_obsolete status as obsolete', async () => {
        await testingEnvironment.setFixtures({
          ...createFixtures(),
          [mongoPXEntitiesStatusCollection]: [
            { ...entityStatus, status: EntityStatus.ProcessingObsolete },
          ],
        });
        const { sut } = createSut();

        await sut.markAsProcessed(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.Obsolete }]);
      });

      it('should mark an EntityStatus as processed', async () => {
        const { sut } = createSut();

        await sut.markAsProcessed(entityStatus._id.toString());

        expect(await statuses()).toMatchObject([{ status: EntityStatus.Processed }]);
      });
    });

    describe('delete', () => {
      it('should delete an EntityStatus', async () => {
        const { sut } = createSut();

        await sut.delete(entityStatus._id.toString());

        expect(await statuses()).toHaveLength(0);
      });

      it('should delete EntityStatus by source entity', async () => {
        const { sut } = createSut();

        await sut.deleteBySourceEntity(entitySharedId);

        expect(await statuses()).toHaveLength(0);
      });

      it('should delete every EntityStatus for a source entity', async () => {
        await testingEnvironment.setFixtures({
          ...createFixtures(),
          [mongoPXEntitiesStatusCollection]: [entityStatus, secondEntityStatus],
        });
        const { sut } = createSut();

        await sut.deleteBySourceEntity(entitySharedId);

        expect(await statuses()).toHaveLength(0);
      });
    });

    describe('getAll', () => {
      it('should list EntityStatus filtered by fields', async () => {
        const { sut } = createSut();

        expect(await sut.getAll({}).all()).toHaveLength(1);
        expect(await sut.getAll({ entitySharedId }).all()).toHaveLength(1);
        expect(await sut.getAll({ extractorId: extractorId.toString() }).all()).toHaveLength(1);
        expect(await sut.getAll({ status: EntityStatus.New }).all()).toHaveLength(1);
      });
    });
  });
});
