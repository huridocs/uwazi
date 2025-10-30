import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TestUtils } from 'api/common.v2/utils/Test';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { PropertyCreatorServiceStrategy } from '../propertyCreatorService/PropertyCreatorServiceStrategy';
import { NestedPropertyNotAvailableError } from '../../domain/template/errors';
import { NestedProperty } from '../../domain/template/NestedProperty';

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
