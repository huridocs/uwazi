import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { FileUploadForEntityFactory } from '#api/core/infrastructure/factories/FileUploadForEntityFactory.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { fileExistsOnPath } from '#api/files/index.js';
import { tenants } from '#api/tenants/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template')],
  entities: [f.entity('entity1', 'template')],
};

const schedulePDFPostProcessMock = jest.fn().mockResolvedValue(undefined);

describe('FileUploadForEntity', () => {
  let result: any;
  let eventBus: EventsBus;
  let pathManager: PathManager;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, true);

    const jobsDispatcher = TestUtils.mockClass<Dispatcher>({
      postProcessPDFs: schedulePDFPostProcessMock,
    });

    eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

    pathManager = new PathManager({ tenant: tenants.current() });

    const transactionManager = TransactionManagerFactory.default();

    const filesService = FilesServiceFactory.default(transactionManager, {
      jobsDispatcher,
      eventBus,
    });

    const useCase = FileUploadForEntityFactory.default(transactionManager, {
      filesService,
      eventBus,
    });

    result = await useCase.execute({
      entityId: 'entity1',
      uploadedFile: new InputFile(
        {
          fieldname: 'document',
          originalname: 'test_upload.pdf',
          encoding: 'utf-8',
          mimetype: 'application/pdf',
          destination: testingEnvironment.testingFilesPath(''),
          filename: 'english.pdf',
          path: testingEnvironment.testingFilesPath('english.pdf'),
          size: 1000,
        },
        'document'
      ),
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should upload and save file in db', async () => {
    const [file] = await testingEnvironment.db.getAllFrom('files');

    expect(file).toMatchObject({
      status: 'processing',
      entity: 'entity1',
      originalname: 'test_upload.pdf',
      filename: result.filename,
    });
  });

  it('should dispatch PDFPostProcessJobHandler for document files', () => {
    expect(schedulePDFPostProcessMock).toHaveBeenCalledTimes(1);
    expect(schedulePDFPostProcessMock).toHaveBeenCalledWith([
      {
        documentId: result._id,
        userId: permissionsContext.getUserInContext()?._id?.toString(),
        tenantName: tenants.current().name,
      },
    ]);
  });

  it('should store file in the correct directory on filesystem', async () => {
    const expectedPath = pathManager.createPath({
      filename: result.filename,
      type: 'document',
    });

    const fileExists = await fileExistsOnPath(expectedPath);
    expect(fileExists).toBe(true);

    const [dbFile] = await testingEnvironment.db
      .getAllFrom('files')
      .then(files => files.filter(file => file._id.toString() === result._id));

    expect(dbFile).toMatchObject({
      filename: result.filename,
      originalname: 'test_upload.pdf',
      type: 'document',
      entity: 'entity1',
      status: 'processing',
    });
  });

  it('should emit FileCreatedEvent when file is uploaded', () => {
    expect(eventBus.emit).toHaveBeenCalledTimes(1);
    expect(eventBus.emit).toHaveBeenCalledWith(
      new FileCreatedEvent({
        newFile: expect.objectContaining({
          _id: ObjectId.createFromHexString(result._id),
          filename: result.filename,
          originalname: 'test_upload.pdf',
          entity: 'entity1',
          type: 'document',
          status: 'processing',
        }),
      })
    );
  });
});
