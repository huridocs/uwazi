// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

/* eslint-disable max-statements */
import { TestUtils } from 'api/common.v2/utils/Test';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { PDFPostProcessJob } from 'api/core/infrastructure/jobs/PDFPostProcessJob';
import { PDFService } from 'api/core/infrastructure/services/PDFService';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { Attachment } from 'api/files.v2/model/Attachment';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { Document } from 'api/files.v2/model/Document';
import { FileContents } from 'api/files.v2/model/FileContents';
import { InputFile } from 'api/files.v2/model/InputFile';
import { Thumbnail } from 'api/files.v2/model/Thumbnail';
import { UwaziFile } from 'api/files.v2/model/UwaziFile';
import { FileBuilder } from 'api/files.v2/specs/FileBuilder';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { tmpdir } from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { FilesService } from '../FilesService';
import { createHash } from 'crypto';

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
  const service = new FilesService({
    idGenerator: IdGeneratorFactory.default(),
    fileStorage,
    filesDS: FilesDataSourceFactory.default(TransactionManagerFactory.default()),
    jobsDispatcher,
    filesIO: new FileContentsIO(),
    pdfService: new PDFService(),
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

  describe('fromInputFiles', () => {
    it('should return array of Documents/attachments', async () => {
      const { service } = createSut();
      const documentInput = new InputFile(
        {
          fieldname: '',
          originalname: 'test-files.pdf',
          mimetype: 'application/pdf',
          encoding: 'encoding',
          destination: '',
          filename: '',
          path: 'path',
          size: 1,
        },
        'document'
      );
      const attachmentInput = new InputFile(
        {
          fieldname: '',
          originalname: 'test-files.txt',
          mimetype: 'text/plain',
          encoding: 'encoding',
          destination: '',
          filename: '',
          path: 'path',
          size: 1,
        },
        'attachment'
      );

      const [document, attachment] = await service.fromInputFiles('entity', [
        documentInput,
        attachmentInput,
      ]);

      expect(document).toBeInstanceOf(Document);
      expect(attachment).toBeInstanceOf(Attachment);
      expect(document).toMatchObject({
        id: expect.any(String),
        entity: 'entity',
        originalname: 'test-files.pdf',
        mimetype: 'application/pdf',
        size: 1,
        filename: '',
        status: 'processing',
        creationDate: expect.any(Number),
      });

      expect(attachment).toMatchObject({
        id: expect.any(String),
        entity: 'entity',
        originalname: 'test-files.txt',
        mimetype: 'text/plain',
        size: 1,
        filename: '',
        creationDate: expect.any(Number),
      });
    });
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
