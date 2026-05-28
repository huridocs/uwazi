// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';

/* eslint-disable max-statements */
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileWithContents } from '#api/core/domain/files/FileWithContents.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileUpdatedEvent } from '#api/files/events/FileUpdatedEvent.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { tenants } from '#api/tenants/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FilesDataSource } from '../contracts/FilesDataSource.js';
import { FilesServiceDeps } from '../FilesService.js';

const f = getFixturesFactory();

const storedFiles: { [k: string]: FileContents[] } = {
  document: [],
  attachment: [],
};
const dispatchedDeletes: string[] = [];
const fileStorage = TestUtils.mockClass<FileStorage>({
  async storeFile(file: FileWithContents) {
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
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
    const attachment = FileBuilder.attachment(f.idString('attachment_id'), { filename: 'attach' });
    let capturedUserId: string | undefined;

    beforeAll(async () => {
      const transactionManager = TransactionManagerFactory.fake();
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
    });

    it('should insert uwazi files in the db', async () => {
      const dbFiles = await testingEnvironment.db.getAllFrom('files');

      expect(dbFiles).toMatchObject([
        { _id: new ObjectId(document.id), filename: 'doc' },
        { _id: new ObjectId(attachment.id), filename: 'attach' },
      ]);
    });

    it('should dispatch pdf post process jobs when file is document', async () => {
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
    const fixtures: DBFixture = {
      settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
      entities: [f.entity('entity 1'), f.entity('entity2'), f.entity('entity3')],
      files: [
        f.document('doc1', {
          entity: 'entity1',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
          status: 'ready',
        }),
        ...f.processedDocument('doc2', {
          entity: 'entity1',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
        }),
        f.document('doc3', {
          entity: 'entity2',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
          status: 'ready',
        }),
        ...f.processedDocument('doc4', {
          entity: 'entity2',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
        }),
        f.document('doc5', {
          entity: 'entity3',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
          status: 'ready',
        }),
        ...f.processedDocument('doc6', {
          entity: 'entity3',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
        }),
      ],
    };

    it('should delete all files belogning to entity ids', async () => {
      await testingEnvironment.setUp(fixtures);
      testingTenants.changeCurrentTenant({
        uploadedDocuments: 'tenant/uploads',
      });
      const { service, transactionManager } = createService();

      await transactionManager.run(async () => {
        await service.deleteEntityFiles(['entity1', 'entity3']);
      });

      const dbFiles = await testingEnvironment.db.getAllFrom('files');

      expect(dbFiles).toMatchObject([
        { entity: 'entity2', type: 'document' },
        { entity: 'entity2', type: 'document' },
        { entity: 'entity2', type: 'thumbnail' },
      ]);

      expect(dispatchedDeletes).toMatchObject([
        'tenant/uploads/doc1',
        'tenant/uploads/doc2',
        'tenant/uploads/doc5',
        'tenant/uploads/doc6',
        expect.stringContaining('.jpg'),
        expect.stringContaining('.jpg'),
      ]);
    });
  });

  describe('delete', () => {
    describe('when an entity has multiple documents each with a thumbnail', () => {
      const fixtures: DBFixture = {
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        entities: [f.entity('entity1')],
        files: [
          ...f.processedDocument('doc1', {
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
            size: 1000,
            creationDate: 1000,
          }),
          ...f.processedDocument('doc2', {
            entity: 'entity1',
            language: 'es',
            mimetype: 'application/pdf',
            size: 1000,
            creationDate: 1000,
          }),
        ],
      };

      it('should only delete the thumbnail belonging to the deleted document', async () => {
        await testingEnvironment.setUp(fixtures);
        const transactionManager = TransactionManagerFactory.fake();
        const { service, filesDataSource } = createService();

        const doc1 = (await filesDataSource.getById(f.idString('doc1'))).getDataOrThrow();

        await transactionManager.run(async () => {
          await service.delete([doc1]);
        });

        const dbFiles = await testingEnvironment.db.getAllFrom('files');
        const filenames = dbFiles.map(file => file.filename);

        expect(filenames).not.toContain(`${f.idString('doc1')}.jpg`);
        expect(filenames).toContain(`${f.idString('doc2')}.jpg`);
      });
    });
  });

  describe('when bulk upserting files', () => {
    it('should only update files that have changes', async () => {
      const filesDS = TestUtils.mockClass<FilesDataSource>({ bulkUpdate: jest.fn() });
      const eventBus = TestUtils.mockClass<EventsBus>({
        emit: jest.fn(),
      });

      const { service, transactionManager } = createService({ filesDS, eventBus });

      const file = FileBuilder.document('file1');

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
          after: updateFile.toDTO(),
          before: updateFile.previousVersion!.toDTO(),
        })
      );
    });
  });
});
