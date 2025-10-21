import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
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
      templatesDS: DefaultTemplatesDataSource(DefaultTransactionManager()),
      thesauriDS: new MongoThesauriDataSource(),
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
