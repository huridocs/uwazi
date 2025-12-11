/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { FileUploadForEntityFactory } from 'api/core/infrastructure/factories/FileUploadForEntityFactory';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TestUtils } from 'api/common.v2/utils/Test';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { PDFPostProcessJobHandler } from 'api/core/infrastructure/jobs/PDFPostProcessJobHandler';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { fileExistsOnPath } from 'api/files';
import { tenants } from 'api/tenants';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { FilesServiceFactory } from 'api/core/infrastructure/factories/FilesServiceFactory';
import { EventsBus } from 'api/core/libs/eventsbus';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { ObjectId } from 'mongodb';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template')],
  entities: [f.entity('entity1', 'template')],
};

const dispatchedJobs: Array<{ job: any; params: any }> = [];

const dispatchMock = jest.fn().mockImplementation((job, params) => {
  dispatchedJobs.push({ job, params });
});

describe('FileUploadForEntity', () => {
  let result: any;
  let eventBus: EventsBus;
  let pathManager: PathManager;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, true);

    const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
      dispatchMany: async callback => {
        await callback(dispatchMock);
      },
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
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(PDFPostProcessJobHandler, {
      documentId: result._id,
      userId: permissionsContext.getUserInContext()?._id?.toString(),
      tenantName: tenants.current().name,
    });
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
