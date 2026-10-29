import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { search } from '#api/search/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const factory = getFixturesFactory();

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('FilesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    let indexEntitiesSpy: jest.SpyInstance;

    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingPG.clear(['files']);
      await testingEnvironment.setFixtures({ files: [] });
      indexEntitiesSpy = jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
    });

    afterEach(() => {
      indexEntitiesSpy.mockRestore();
    });

    const createSut = () =>
      testingEnvironment.runWithContext(() => ({
        sut: FilesDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
      }));

    describe('reindexing on transaction commit', () => {
      it('does not register a commit handler when constructed', () => {
        const onCommittedSpy = testingEnvironment.runWithContext(() => {
          const spy = jest.spyOn(ExecutionContext.transactionManager, 'onCommitted');
          FilesDataSourceFactory.default();
          return spy;
        });

        expect(onCommittedSpy).not.toHaveBeenCalled();
      });

      it('reindexes the entities of every file written within a run once', async () => {
        const { sut, transactionManager } = createSut();

        await transactionManager.run(async () => {
          await sut.create(
            FileBuilder.attachment(factory.idString('a1'), {
              entity: 'entity1',
              filename: 'a1.pdf',
            })
          );
          await sut.create(
            FileBuilder.attachment(factory.idString('a2'), {
              entity: 'entity2',
              filename: 'a2.pdf',
            })
          );
        });

        expect(indexEntitiesSpy).toHaveBeenCalledTimes(1);
        expect(indexEntitiesSpy.mock.calls[0][0].sharedId.$in.sort()).toEqual([
          'entity1',
          'entity2',
        ]);
      });
    });
  });
});
