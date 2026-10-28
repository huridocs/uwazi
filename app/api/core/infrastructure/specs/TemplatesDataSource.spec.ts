import { ObjectId } from 'mongodb';
import { CreationDateProperty } from '#api/core/domain/template/CreationDateProperty.js';
import { ModifiedDateProperty } from '#api/core/domain/template/ModifiedDateProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TitleProperty } from '#api/core/domain/template/TitleProperty.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import * as entitiesIndex from '#api/search/entitiesIndex.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const fixtures = {
  settings: [{ languages: [{ default: true, key: 'en' as const, label: 'English' }] }],
};

const newId = () => new ObjectId().toString();

const createTemplate = (name: string) => {
  const template = newId();
  return TemplateBuilder.aTemplate({ id: template, name })
    .withCommonProperties([
      new TitleProperty({ id: newId(), label: 'Title', template }),
      new CreationDateProperty({ id: newId(), label: 'Date added', template }),
      new ModifiedDateProperty({ id: newId(), label: 'Date modified', template }),
    ])
    .withProperties([new TextProperty({ id: newId(), template, label: 'Text' })])
    .build();
};

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('TemplatesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    let updateMappingSpy: jest.SpyInstance;

    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingPG.clear(['templates']);
      await testingEnvironment.setFixtures(fixtures);
      updateMappingSpy = jest.spyOn(entitiesIndex, 'updateMapping').mockResolvedValue(undefined);
    });

    afterEach(() => {
      updateMappingSpy.mockRestore();
    });

    const createSut = () =>
      testingEnvironment.runWithContext(() => ({
        sut: TemplatesDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
      }));

    describe('mapping update on transaction commit', () => {
      it('does not register a commit handler when constructed', () => {
        const onCommittedSpy = testingEnvironment.runWithContext(() => {
          const spy = jest.spyOn(ExecutionContext.transactionManager, 'onCommitted');
          TemplatesDataSourceFactory.default();
          return spy;
        });

        expect(onCommittedSpy).not.toHaveBeenCalled();
      });

      it('does not update the mapping when the instance wrote nothing', async () => {
        const { transactionManager } = createSut();

        await transactionManager.run(async () => {});

        expect(updateMappingSpy).not.toHaveBeenCalled();
      });

      it('updates the mapping of every template written within a run once', async () => {
        const template1 = createTemplate('template1');
        const template2 = createTemplate('template2');
        const { sut, transactionManager } = createSut();

        await transactionManager.run(async () => {
          await sut.create(template1);
          await sut.create(template2);
        });

        expect(updateMappingSpy).toHaveBeenCalledTimes(1);
        const names = updateMappingSpy.mock.calls[0][0].map((t: { name: string }) => t.name);
        expect(names.sort()).toEqual(['template1', 'template2']);
      });
    });
  });
});
