// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

/* eslint-disable max-statements */
import { TestUtils } from 'api/common.v2/utils/Test';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { Attachment } from 'api/core/domain/files/Attachment';
import { DiskFile } from 'api/core/domain/files/DiskFile';
import { Document } from 'api/core/domain/files/Document';
import { FileContents } from 'api/core/domain/files/FileContents';
import { FileBuilder } from 'api/core/domain/files/specs/FileBuilder';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { UwaziFile } from 'api/core/domain/files/UwaziFile';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { PDFPostProcessJob } from 'api/core/infrastructure/jobs/PDFPostProcessJob';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoRelationshipsV1DataSource } from 'api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource';
import { PDFService } from 'api/core/infrastructure/services/PDFService';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
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
import { FilesService } from '../FilesService';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
};

const fileContents = () =>
  new DiskFile(path.join(__dirname, '../../testing/testing_files')).toContent();

const storedFiles: { [k: string]: FileContents[] } = {
  document: [],
  attachment: [],
};
const fileStorage = TestUtils.mockClass<FileStorage>({
  async storeFile(file: UwaziFile) {
    storedFiles[file.type].push(file.content);
  },
});

const dispatchMock = jest.fn();
const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
  dispatchMany: async callback => {
    await callback(dispatchMock);
  },
});

const createSut = () => {
  const transactionManager = TransactionManagerFactory.fake();
  const service = new FilesService({
    idGenerator: IdGeneratorFactory.default(),
    fileStorage,
    filesDS: FilesDataSourceFactory.default(TransactionManagerFactory.default()),
    jobsDispatcher,
    filesIO: new FileContentsIO(),
    pdfService: new PDFService(),
    relV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
    transactionManager,
    eventBus: applicationEventsBus,
  });
  return { service };
};

describe('FilesService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('storeFiles', () => {
    it('should store UwaziFiles on its proper destination', async () => {
      const { service } = createSut();
      const document = new Document({
        entity: 'entity',
        id: 'document id',
        originalname: 'test-files.txt',
        mimetype: 'text/plain',
        filename: 'eng.pdf',
        uploaded: true,
        size: 0,
        status: 'processing',
        creationDate: 0,
        content: fileContents(),
      });

      const attachment = new Attachment({
        entity: 'entity',
        id: 'document id',
        originalname: 'test-files.txt',
        mimetype: 'text/plain',
        filename: 'eng.pdf',
        uploaded: true,
        size: 0,
        creationDate: 0,
        content: fileContents(),
      });

      await service.storeFiles([document, attachment]);

      expect(storedFiles.document).toMatchObject([document.content]);
      expect(storedFiles.attachment).toMatchObject([attachment.content]);
    });
  });

  // describe('deleteEntityFiles', () => {
  //   it('should delete all files belogning to entity ids', async () => {
  //     expect(true).toBe(false);
  //   });
  // });

  describe('insert', () => {
    const document = new Document({
      entity: 'entity',
      id: f.idString('document_id'),
      originalname: 'test-files.txt',
      mimetype: 'text/plain',
      filename: 'eng.pdf',
      uploaded: true,
      size: 0,
      status: 'processing',
      creationDate: 0,
      content: fileContents(),
    });

    const attachment = new Attachment({
      entity: 'entity',
      id: f.idString('attachment_id'),
      originalname: 'test-files.txt',
      mimetype: 'text/plain',
      filename: 'eng.pdf',
      uploaded: true,
      size: 0,
      creationDate: 0,
      content: fileContents(),
    });

    beforeAll(async () => {
      const { service } = createSut();
      await service.insert([document, attachment]);
    });

    it('should insert uwazi files in the db', async () => {
      const dbFiles = await testingEnvironment.db.getAllFrom('files');

      expect(dbFiles).toMatchObject([
        { _id: new ObjectId(document.id) },
        { _id: new ObjectId(attachment.id) },
      ]);
    });

    it('should dispatch pdf post process jobs when file is document', async () => {
      expect(dispatchMock).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledWith(PDFPostProcessJob, {
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
      const { service } = createSut();

      const doc = FileBuilder.processedDocument(f.idString('doc'), {
        content: new DiskFile(
          path.join(
            __dirname,
            '../../infrastructure/services/specs/testing_files',
            '12345.test.pdf'
          )
        ).toContent(),
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
          path.join(
            __dirname,
            '../../infrastructure/services/specs/testing_files/12345.thumb.proof.jpg'
          ),
          thumbnailPath
        )
      ).toBe(true);
    });
  });
});
