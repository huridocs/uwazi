import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { files } from '#api/files/index.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import testingDB from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import templates from '../templates.js';
import fixtures, {
  propertyA,
  propertyB,
  propertyC,
  propertyD,
  templateWithExtractedMetadata,
} from './fixtures/fixtures.js';

async function updateTemplate(template: TemplateSchema) {
  jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();

  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = new SyncDispatcherForTests({
    TemplatePostProcessEntitiesJob: async () =>
      new TemplatePostProcessEntitiesJob({
        useCase: new TemplateUpdateDenormalizeEntitiesBatch({
          entitiesDS: EntitiesDataSourceFactory.default(transactionManager),
          relationshipsV1DS: new MongoRelationshipsV1DataSource(
            getConnection(),
            transactionManager
          ),
          templatesDS: TemplatesDataSourceFactory.default(transactionManager),
          transactionManager,
          filesDS: FilesDataSourceFactory.default(),
        }),
        templatesDS: TemplatesDataSourceFactory.default(transactionManager),
      }),
  });
  return testingEnvironment.runWithContext(
    async () => templates.save(template, 'en', true, false),
    {
      factories: {
        jobsDispatcher: () => jobsDispatcher,
      },
    }
  );
}

describe('updateExtractedMetadataProperties', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, true);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should remove deleted template properties from extracted metadata on files', async () => {
    const templateToUpdate: TemplateSchema = {
      _id: templateWithExtractedMetadata,
      name: 'template_with_extracted_metadata',
      commonProperties: [
        {
          _id: testingDB.id(),
          name: 'title',
          label: 'Title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          name: 'creationDate',
          label: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          name: 'editDate',
          label: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      properties: [
        {
          _id: propertyA.toString(),
          label: 'Property A',
          name: 'property_a',
          type: 'text',
        },
        {
          _id: propertyD.toString(),
          label: 'Property D',
          name: 'property_d',
          type: 'link',
        },
        {
          label: 'New unrelated property',
          name: 'new_unrelated_property',
          type: 'image',
        },
        {
          label: 'New text property',
          name: 'new_text_property',
          type: 'text',
        },
      ],
    };

    await updateTemplate(templateToUpdate);

    expect((await files.get())[0]).toMatchObject({
      filename: 'file1.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[1]).toMatchObject({
      filename: 'file2.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[2]).toMatchObject({
      filename: 'file3.pdf',
      extractedMetadata: [],
    });
  });

  it('should rename properties when they get renamed in the templates', async () => {
    const templateWithRenamedProps: TemplateSchema = {
      _id: templateWithExtractedMetadata,
      name: 'template_with_extracted_metadata',
      commonProperties: [
        {
          _id: testingDB.id(),
          name: 'title',
          label: 'Title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          name: 'creationDate',
          label: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: testingDB.id(),
          name: 'editDate',
          label: 'editDate',
          type: 'date',
        },
      ],
      properties: [
        {
          _id: propertyA.toString(),
          label: 'Property A',
          name: 'property_a',
          type: 'text',
        },
        {
          _id: propertyB.toString(),
          label: 'Property B',
          name: 'property_b',
          type: 'markdown',
        },
        {
          _id: propertyC.toString(),
          label: 'Property C but renamed',
          name: 'property_c_but_renamed',
          type: 'numeric',
        },
        {
          _id: propertyD.toString(),
          label: 'Property D',
          name: 'property_d',
          type: 'link',
        },
      ],
    };

    await updateTemplate(templateWithRenamedProps);

    expect((await files.get())[0]).toMatchObject({
      filename: 'file1.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
        {
          name: 'property_b',
        },
        {
          name: 'property_c_but_renamed',
        },
      ],
    });
    expect((await files.get())[1]).toMatchObject({
      filename: 'file2.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[2]).toMatchObject({
      filename: 'file3.pdf',
      extractedMetadata: [],
    });
  });
});
