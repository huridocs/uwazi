import { testingEnvironment } from '../utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';
import { DefaultTemplatesDataSource } from '../templates.v2/database/data_source_defaults.js';
import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { MongoThesauriDataSource } from '../core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { SelectPropertyCreatorService } from '../propertyCreatorService/SelectPropertyCreatorService';
import { SelectPropertyWithInvalidThesaurusError } from '../errors';

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
          type: 'select',
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
          type: 'multiselect',
          template: '',
          content: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(SelectPropertyWithInvalidThesaurusError);
  });
});
