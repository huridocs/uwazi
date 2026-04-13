import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SelectPropertyCreatorService } from '../propertyCreatorService/SelectPropertyCreatorService.js';
import { SelectPropertyWithInvalidThesaurusError } from '../../domain/template/errors.js';

describe('SelectPropertyCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw if Thesaurus does not exist', async () => {
    const sut = new SelectPropertyCreatorService({
      thesauriDS: new MongoThesauriDataSource(getConnection(), TransactionManagerFactory.default()),
      templatesDS: TemplatesDataSourceFactory.default(TransactionManagerFactory.default()),
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text',
          type: PropertyTypeEnum.Select,
          template: '',
          content: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(SelectPropertyWithInvalidThesaurusError);

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text',
          type: PropertyTypeEnum.MultiSelect,
          template: '',
          content: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(SelectPropertyWithInvalidThesaurusError);
  });
});
