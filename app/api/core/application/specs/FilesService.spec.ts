// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

/* eslint-disable max-statements */
import { TestUtils } from 'api/common.v2/utils/Test';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { DiskFile } from 'api/core/infrastructure/files/DiskFile';
import { FileContents } from 'api/core/domain/files/FileContents';
import { FileWithContents } from 'api/core/domain/files/FileWithContents';
import { FileBuilder } from 'api/core/domain/files/specs/FileBuilder';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { FilesServiceFactory } from 'api/core/infrastructure/factories/FilesServiceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DeleteFileFromStorageJobHandler } from 'api/core/infrastructure/jobs/DeleteFileFromStorageJobHandler';
import { PDFPostProcessJobHandler } from 'api/core/infrastructure/jobs/PDFPostProcessJobHandler';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { testingTenants } from 'api/utils/testingTenants';

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

const dispatchMock = jest.fn().mockImplementation((job, params) => {
  if (job === DeleteFileFromStorageJobHandler) {
    dispatchedDeletes.push(params.filePath);
  }
});

const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
  dispatchMany: async callback => {
    await callback(dispatchMock);
  },
});

const createService = () => {
  const transactionManager = TransactionManagerFactory.fake();
  const service = FilesServiceFactory.default(transactionManager, {
    fileStorage,
    jobsDispatcher,
  });
  return { service, transactionManager };
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

    beforeAll(async () => {
      const { service } = createService();
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
      expect(dispatchMock).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledWith(PDFPostProcessJobHandler, {
        documentId: document.id,
        userId: permissionsContext.getUserInContext()?._id?.toString(),
        tenantName: tenants.current().name,
      });
    });
  });

  describe('createThumbnail', () => {
    async function filesAreIdentical(file1: string, file2: string) {
      const [buf1, buf2] = await Promise.all([readFile(file1), readFile(file2)]);
      const hash1 = createHash('sha256').update(buf1).digest('hex');
      const hash2 = createHash('sha256').update(buf2).digest('hex');
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
        f.document('doc1', { entity: 'entity1' }),
        ...f.processedDocument('doc2', { entity: 'entity1' }),
        f.document('doc3', { entity: 'entity2' }),
        ...f.processedDocument('doc4', { entity: 'entity2' }),
        f.document('doc5', { entity: 'entity3' }),
        ...f.processedDocument('doc6', { entity: 'entity3' }),
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
        expect.stringContaining('.jpg'),
        'tenant/uploads/doc5',
        'tenant/uploads/doc6',
        expect.stringContaining('.jpg'),
      ]);
    });
  });
});
