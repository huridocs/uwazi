import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { PropertyCreatorServiceStrategy } from '../propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { NestedPropertyNotAvailableError } from '../../domain/template/errors.js';
import { NestedProperty } from '../../domain/template/NestedProperty.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { DependenciesContext, ContextDependencies } from '#api/core/libs/DependenciesContext.js';
import { tenants } from '#api/tenants/index.js';

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const strategy = PropertyCreatorServiceStrategy.create({
    idGenerator: TestUtils.mockClass({ generate: () => 'id' }),
    thesauriDS: TestUtils.mockClass({}),
    relationshipTypesDS: TestUtils.mockClass({}),
    settingsDS: SettingsDataSourceFactory.default(transactionManager),
    templatesDS: TemplatesDataSourceFactory.default(transactionManager),
  });

  return { sut: strategy.getStrategy('nested') };
};

describe('NestedPropertyCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ project: 'cejil' }],
    });

    const tenant = tenants.current();
    jest.spyOn(DependenciesContext, 'getStore').mockReturnValue({
      instances: {
        elasticClient: ElasticSearchClientFactory.tenantAware(tenant.name),
      },
      factories: {},
    } as ContextDependencies);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an instance of NestedProperty when type is available', async () => {
    const { sut } = createSut();

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Nested Property',
          type: PropertyTypeEnum.Nested,
          template: new ObjectId().toHexString(),
        },
        {}
      )
    ).resolves.toBeInstanceOf(NestedProperty);
  });

  it('should throw NestedPropertyNotAvailableError', async () => {
    const { sut } = createSut();

    await testingEnvironment.setFixtures({ settings: [{ project: 'any' }] });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Nested Property',
          type: PropertyTypeEnum.Nested,
          template: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(NestedPropertyNotAvailableError);
  });
});
