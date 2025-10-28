import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { SelectPropertyCreatorService } from '../propertyCreatorService/SelectPropertyCreatorService';
import { SelectPropertyWithInvalidThesaurusError } from '../../domain/template/errors';

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
