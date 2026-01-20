import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { SelectPropertyCreatorService } from '#api/core/application/propertyCreatorService/SelectPropertyCreatorService.js';
import { SelectPropertyWithInvalidThesaurusError } from '#api/core/domain/template/errors.js';

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
