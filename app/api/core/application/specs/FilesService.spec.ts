/* eslint-disable @typescript-eslint/no-shadow */
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

import { createHash } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';

/* eslint-disable max-statements */
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { FileStorage, FileWithContent } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { FileUpdatedEvent } from '#api/files/events/FileUpdatedEvent.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { tenants } from '#api/tenants/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FilesDataSource } from '../contracts/FilesDataSource.js';
import { FilesServiceDeps } from '../FilesService.js';

const f = getFixturesFactory();

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const allFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  entities: [f.entity('entity1'), f.entity('entity2'), f.entity('entity3')],
  files: [
    f.document('df-doc1', {
      entity: 'entity1',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    ...f.processedDocument('df-doc4', {
      entity: 'entity1',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('df-doc2', {
      entity: 'entity2',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    ...f.processedDocument('df-doc5', {
      entity: 'entity2',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('df-doc3', {
      entity: 'entity3',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    ...f.processedDocument('df-doc6', {
      entity: 'entity3',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    ...f.processedDocument('del-doc1', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    ...f.processedDocument('del-doc2', {
      entity: 'entity1',
      language: 'es',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('dm-doc', {
      entity: 'entity1',
      mimetype: 'application/pdf',
      status: 'ready',
      language: 'en',
      totalPages: 5,
      fullText: { 1: 'text content' },
      generatedToc: true,
      propertySelections: [{ name: 'test', selection: { text: 'highlight' } }],
    }),
    f.attachment('dm-attach', {
      entity: 'entity1',
      mimetype: 'text/plain',
    }),
  ],
};

const storedFiles: { [k: string]: FileContents[] } = {
  document: [],
  attachment: [],
};
const dispatchedDeletes: string[] = [];
const fileStorage = TestUtils.mockClass<FileStorage>({
  async storeFile(file: FileWithContent) {
    storedFiles[file.type].push(file.content);
  },
});

const jobsDispatcher = TestUtils.mockClass<Dispatcher>({
  deleteFilesFromStorage: jest.fn().mockImplementation(async (paths: string[]) => {
    dispatchedDeletes.push(...paths);
  }),
  postProcessPDFs: jest.fn().mockResolvedValue(undefined),
  syncRelationships: jest.fn().mockResolvedValue(undefined),
  cleanupEntities: jest.fn().mockResolvedValue(undefined),
  postProcessTemplateEntities: jest
    .fn()
    .mockImplementation(async (callback: (dispatch: jest.Mock) => Promise<void>) => {
      await callback(jest.fn());
    }),
});

const createService = (deps?: Partial<FilesServiceDeps>) => {
  const transactionManager = TransactionManagerFactory.fake();
  return testingEnvironment.runWithContext(
    () => {
      const filesDataSource = FilesDataSourceFactory.default();
      const service = FilesServiceFactory.default({
        filesDS: filesDataSource,
        fileStorage,
        jobsDispatcher,
        transactionManager,
        ...deps,
      });

      return { service, transactionManager, filesDataSource };
    },
    { factories: { transactionManager: () => transactionManager } }
  );
};

describe('FilesService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
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
      await testingEnvironment.setFixtures(allFixtures);
      dispatchedDeletes.length = 0;
      storedFiles.document = [];
      storedFiles.attachment = [];
      jest.clearAllMocks();
    });

    describe('storeFiles', () => {
      it('should store UwaziFiles on its proper destination', async () => {
        const { service } = createService();

        const document = FileBuilder.document(f.idString('document_id'));
        const attachment = FileBuilder.attachment(f.idString('attachment_id'));

        await service.storeFiles([document, attachment]);

        expect(storedFiles.document).toMatchObject([document.content]);
        expect(storedFiles.attachment).toMatchObject([attachment.content]);
      });
    });

    describe('insert', () => {
      const document = FileBuilder.document(f.idString('document_id'), { filename: 'doc' });
      const attachment = FileBuilder.attachment(f.idString('attachment_id'), {
        filename: 'attach',
      });

      it('should insert uwazi files in the db and dispatch pdf post process jobs', async () => {
        const transactionManager = TransactionManagerFactory.fake();
        let capturedUserId: string | undefined;

        const { service } = testingEnvironment.runWithContext(
          () => {
            capturedUserId = ExecutionContext.actor?._id?.toString();
            const filesDataSource = FilesDataSourceFactory.default();
            return {
              service: FilesServiceFactory.default({
                filesDS: filesDataSource,
                fileStorage,
                jobsDispatcher,
                transactionManager,
              }),
              transactionManager,
            };
          },
          { factories: { transactionManager: () => transactionManager } }
        );
        await service.insert([document, attachment]);

        const dbFiles = usePostgres
          ? await testingPG.getAllFrom('files')
          : await testingEnvironment.db.getAllFrom('files');

        expect(dbFiles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ filename: 'doc' }),
            expect.objectContaining({ filename: 'attach' }),
          ])
        );

        expect(jobsDispatcher.postProcessPDFs).toHaveBeenCalledTimes(1);
        expect(jobsDispatcher.postProcessPDFs).toHaveBeenCalledWith([
          {
            documentId: document.id,
            userId: capturedUserId,
            tenantName: tenants.current().name,
          },
        ]);
      });
    });

    describe('createThumbnail', () => {
      async function filesAreIdentical(file1: string, file2: string) {
        const [buf1, buf2] = await Promise.all([readFile(file1), readFile(file2)]);
        const hash1 = createHash('sha256').update(new Uint8Array(buf1)).digest('hex');
        const hash2 = createHash('sha256').update(new Uint8Array(buf2)).digest('hex');
        return hash1 === hash2;
      }
      it('should create thumbnail from a ProcessedDocument', async () => {
        const { service } = createService();

        const doc = FileBuilder.processedDocument(f.idString('doc'), {
          content: new DiskFile(testingEnvironment.testingFilesPath('english.pdf')).toContent(),
        });

        const thumbnail = (await service.createThumbnail(doc, 'en')).getDataOrThrow();
        expect(thumbnail).toBeInstanceOf(Thumbnail);

        expect(thumbnail).toMatchObject({
          filename: `${doc.id}.jpg`,
          size: 1936,
          language: 'en',
          mimetype: 'image/jpeg',
          entity: doc.entity,
        });

        const thumbnailPath = path.join(tmpdir(), `thumbnail_${Date.now()}_${Math.random()}.jpg`);
        await pipeline(thumbnail.content.read(), createWriteStream(thumbnailPath));

        expect(
          await filesAreIdentical(
            testingEnvironment.testingFilesPath('english.pdf.thumb.proof.jpg'),
            thumbnailPath
          )
        ).toBe(true);
      });
    });

    describe('deleteEntityFiles', () => {
      it('should delete all files belonging to entity ids', async () => {
        testingTenants.changeCurrentTenant({
          name: 'tenant',
          uploadedDocuments: 'tenant/uploads',
          featureFlags: { postgresFiles: usePostgres },
        });
        const { service, transactionManager } = createService();

        await transactionManager.run(async () => {
          await service.deleteEntityFiles(['entity1', 'entity3']);
        });

        const dbFiles = usePostgres
          ? await testingPG.getAllFrom('files')
          : await testingEnvironment.db.getAllFrom('files');

        const entity2Files = dbFiles.filter(f => f.entity === 'entity2');

        expect(entity2Files).toHaveLength(3);
        expect(entity2Files.filter(f => f.type === 'document')).toHaveLength(2);
        expect(entity2Files.filter(f => f.type === 'thumbnail')).toHaveLength(1);

        expect(dispatchedDeletes).toEqual(
          expect.arrayContaining([
            'tenant/uploads/df-doc1',
            'tenant/uploads/df-doc4',
            'tenant/uploads/df-doc3',
            'tenant/uploads/df-doc6',
            'tenant/uploads/del-doc1',
            'tenant/uploads/del-doc2',
          ])
        );
        expect(dispatchedDeletes.filter(p => p.endsWith('.jpg')).length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('delete', () => {
      it('should only delete the thumbnail belonging to the deleted document', async () => {
        const transactionManager = TransactionManagerFactory.fake();
        const { service, filesDataSource } = createService();

        const doc1 = (await filesDataSource.getById(f.idString('del-doc1'))).getDataOrThrow();

        await transactionManager.run(async () => {
          await service.delete([doc1]);
        });

        const dbFiles = usePostgres
          ? await testingPG.getAllFrom('files')
          : await testingEnvironment.db.getAllFrom('files');

        const filenames = dbFiles.map(file => file.filename);

        expect(filenames).not.toContain(`${f.idString('del-doc1')}.jpg`);
        expect(filenames).toContain(`${f.idString('del-doc2')}.jpg`);
      });
    });

    describe('demoteToAttachment', () => {
      it('should demote a document to an attachment and clear document-specific fields', async () => {
        const docId = f.idString('dm-doc');
        const { service } = createService();
        await service.demoteToAttachment(docId);

        const dbFiles = usePostgres
          ? await testingPG.getAllFrom('files')
          : await testingEnvironment.db.getAllFrom('files');

        const demoted = usePostgres
          ? (dbFiles as Record<string, unknown>[]).find(file => file._id === docId)!
          : (dbFiles as Record<string, unknown>[]).find(
              file => (file._id as any).toString() === docId
            )!;

        expect(demoted).toBeDefined();
        expect(demoted.type).toBe('attachment');
        expect(demoted.entity).toBe('entity1');

        if (usePostgres) {
          expect(demoted.fullText).toBeNull();
          expect(demoted.totalPages).toBeNull();
          expect(demoted.propertySelections).toBeNull();
          expect(demoted.generatedToc).toBeNull();
          expect(demoted.language).toBeNull();
          expect(demoted.status).toBeNull();
        } else {
          expect(demoted.fullText).toBeUndefined();
          expect(demoted.totalPages).toBeUndefined();
          expect(demoted.propertySelections).toBeUndefined();
          expect(demoted.generatedToc).toBeUndefined();
          expect(demoted.language).toBeUndefined();
          expect(demoted.status).toBeUndefined();
        }
      });

      it('should throw when file is not found', async () => {
        const { service } = createService();
        await expect(service.demoteToAttachment('non_existent_id')).rejects.toThrow();
      });

      it('should throw when file is not a document', async () => {
        const attachId = f.idString('dm-attach');
        const { service } = createService();
        await expect(service.demoteToAttachment(attachId)).rejects.toThrow(/expected 'document'/);
      });
    });

    describe('when bulk upserting files', () => {
      it('should only update files that have changes', async () => {
        const filesDS = TestUtils.mockClass<FilesDataSource>({ bulkUpdate: jest.fn() });
        const eventBus = TestUtils.mockClass<EventsBus>({
          emit: jest.fn(),
        });

        const { service, transactionManager } = createService({ filesDS, eventBus });

        const file = FileBuilder.document('507f191e810c19729de860ea');

        await service.bulkUpsert([file]);
        await transactionManager.executeOnCommitHandlers(null);

        expect(filesDS.bulkUpdate).not.toHaveBeenCalled();
        expect(eventBus.emit).not.toHaveBeenCalled();

        const updateFile = file.update({ originalname: 'new name' });

        await service.bulkUpsert([updateFile]);
        await transactionManager.executeOnCommitHandlers(null);

        expect(filesDS.bulkUpdate).toHaveBeenCalledWith([updateFile]);

        expect(eventBus.emit).toHaveBeenCalledWith(
          new FileUpdatedEvent({
            after: FileMappers.toDBO(updateFile),
            before: FileMappers.toDBO(updateFile.previousVersion!),
          })
        );
      });
    });
  });
});
