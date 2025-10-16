import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { TestUtils } from 'api/common.v2/utils/Test';
import { PropertyCreatorServiceStrategy } from '../propertyCreatorService/PropertyCreatorServiceStrategy';
import { NestedPropertyNotAvailableError } from '../errors';
import { NestedProperty } from '../NestedProperty';

const createSut = () => {
  const transactionManager = DefaultTransactionManager();
  const strategy = PropertyCreatorServiceStrategy.create({
    idGenerator: TestUtils.mockClass({ generate: () => 'id' }),
    thesauriDS: TestUtils.mockClass({}),
    relationshipTypesDS: TestUtils.mockClass({}),
    settingsDS: DefaultSettingsDataSource(transactionManager),
    templatesDS: DefaultTemplatesDataSource(transactionManager),
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
          type: 'nested',
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
          type: 'nested',
          template: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(NestedPropertyNotAvailableError);
  });
});
