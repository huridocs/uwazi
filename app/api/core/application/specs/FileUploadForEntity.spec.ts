import { ObjectId } from 'mongodb';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { FileUploadForEntityFactory } from '#api/core/infrastructure/factories/FileUploadForEntityFactory.js';
import { fileExistsOnPath } from '#api/files/index.js';
import { tenants } from '#api/tenants/index.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';

jest.mock('#api/search/index.js', () => {
  const { elastic } = jest.requireActual('#api/search/elastic.js') as {
    elastic: Record<string, unknown>;
  };
  return {
    search: {
      indexEntities: jest.fn().mockResolvedValue(undefined),
      updateTemplatesMapping: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      bulkIndex: jest.fn().mockResolvedValue(undefined),
      bulkDelete: jest.fn().mockResolvedValue(undefined),
      deleteLanguage: jest.fn().mockResolvedValue(undefined),
    },
    elastic,
  };
});

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template')],
  entities: [f.entity('entity1', 'template')],
  files: [],
};

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('FileUploadForEntity', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { elasticIndex: true, postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'tenant',
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
    });

    const createInputFile = () =>
      new InputFile(
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
      );

    const createSut = () => {
      const schedulePDFPostProcessMock = jest.fn().mockResolvedValue(undefined);
      const jobsDispatcher = TestUtils.mockClass<Dispatcher>({
        postProcessPDFs: schedulePDFPostProcessMock,
      });
      const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

      const { useCase, pathManager, actorId, tenantName } = testingEnvironment.runWithContext(
        () => {
          const filesService = FilesServiceFactory.default({ jobsDispatcher, eventBus });
          const pm = new PathManager({ tenant: tenants.current() });
          const aId = ExecutionContext.actor?._id?.toString();
          const tName = tenants.current().name;
          return {
            useCase: FileUploadForEntityFactory.default({ filesService }),
            pathManager: pm,
            actorId: aId,
            tenantName: tName,
          };
        }
      );

      return { useCase, schedulePDFPostProcessMock, eventBus, pathManager, actorId, tenantName };
    };

    it('should upload and save file in db', async () => {
      const { useCase } = createSut();

      const result = await useCase.execute({
        entityId: 'entity1',
        uploadedFile: createInputFile(),
      });

      const [file] = await testingEnvironment.db.getAllFrom('files');

      expect(file).toMatchObject({
        status: 'processing',
        entity: 'entity1',
        originalname: 'test_upload.pdf',
        filename: result.filename,
      });
    });

    it('should dispatch PDFPostProcessJobHandler for document files', async () => {
      const { useCase, schedulePDFPostProcessMock, actorId, tenantName } = createSut();

      const result = await useCase.execute({
        entityId: 'entity1',
        uploadedFile: createInputFile(),
      });

      expect(schedulePDFPostProcessMock).toHaveBeenCalledTimes(1);
      expect(schedulePDFPostProcessMock).toHaveBeenCalledWith([
        {
          documentId: result._id,
          userId: actorId,
          tenantName,
        },
      ]);
    });

    it('should store file in the correct directory on filesystem', async () => {
      const { useCase, pathManager } = createSut();

      const result = await useCase.execute({
        entityId: 'entity1',
        uploadedFile: createInputFile(),
      });

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

    it('should emit FileCreatedEvent when file is uploaded', async () => {
      const { useCase, eventBus } = createSut();

      const result = await useCase.execute({
        entityId: 'entity1',
        uploadedFile: createInputFile(),
      });

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
});
