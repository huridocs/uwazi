import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { config } from '#api/config.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { S3Error } from '#api/files/S3Storage.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { Readable } from 'node:stream';
import { S3FileStorage } from '../S3FileStorage.js';

const f = getFixturesFactory();

describe('S3FileStorage', () => {
  let s3Client: S3Client;
  let s3fileStorage: S3FileStorage;
  let tenant: Tenant;
  const fileIO = new FileContentsIO();

  const toString = async (s3File: GetObjectCommandOutput) => {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const _buf: Buffer[] = [];
      (s3File.Body as Readable).on('data', (chunk: any) => _buf.push(chunk));
      (s3File.Body as Readable).on('end', () =>
        resolve(Buffer.concat(_buf as unknown as Uint8Array[]))
      );
      (s3File.Body as Readable).on('error', (err: unknown) => reject(err));
    });
    return buffer.toString('utf8');
  };

  beforeEach(async () => {
    config.s3 = {
      endpoint: 'http://127.0.0.1:9000',
      bucket: 'uwazi-development',
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
      batchSize: 1,
    };

    s3Client = new S3Client({
      apiVersion: 'latest',
      region: 'region',
      forcePathStyle: true, // needed for minio
      ...config.s3,
    });
    await s3Client.send(new CreateBucketCommand({ Bucket: 'uwazi-development' }));

    tenant = {
      name: 'test-tenant',
      dbName: 'test-tenant',
      indexName: 'test-tenant',
      uploadedDocuments: 'test-tenant/documents',
      attachments: 'test-tenant/attachments',
      customUploads: 'test-tenant/customUploads',
      activityLogs: 'test-tenant/log',
    };

    testingTenants.mockCurrentTenant(tenant);

    s3fileStorage = new S3FileStorage(s3Client, new FileContentsIO(), tenant);
  });

  afterEach(async () => {
    const allBucketKeys = (
      (
        await s3Client.send(
          new ListObjectsCommand({
            Bucket: 'uwazi-development',
          })
        )
      ).Contents || []
    ).map(content => content.Key);

    await Promise.all(
      allBucketKeys.map(async key =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: 'uwazi-development',
            Key: key,
          })
        )
      )
    );
    await s3Client.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
    s3Client.destroy();
  });

  describe('list', () => {
    it('should list all s3 keys', async () => {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant/documents/document1',
          Body: 'body',
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant/documents/document2',
          Body: 'body',
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant-2/documents/document3',
          Body: 'body',
        })
      );

      const listedFiles = await s3fileStorage.list();

      expect(listedFiles.map(file => file.fullPath).sort()).toEqual(
        ['test-tenant/documents/document1', 'test-tenant/documents/document2'].sort()
      );
    });
  });

  describe('getPath', () => {
    it.each([
      {
        file: new ProcessedPDF({
          id: 'id',
          entity: 'entity',
          language: 'ab',
          mimetype: 'application/pdf',
          totalPages: 1,
          creationDate: 1,
          size: 1,
          filename: 'document',
          originalname: 'original.pdf',
          fullText: {},
          generatedToc: false,
          content: new DiskFile('fake/path').toContent(),
        }),
        expected: 'test-tenant/documents/document',
      },
      {
        file: new FileAttachment({
          id: 'id',
          entity: 'entity',
          mimetype: 'application/pdf',
          creationDate: 1,
          size: 1,
          filename: 'attachment',
          originalname: 'original.pdf',
          content: new DiskFile('fake/path').toContent(),
        }),
        expected: 'test-tenant/attachments/attachment',
      },
    ])(
      'should use dinamic paths based on tenant ($file.filename -> $expected)',
      async ({ file, expected }) => {
        const key = s3fileStorage.getPath(file);
        expect(key).toBe(expected);
      }
    );
  });

  describe('getFile', () => {
    it('should retrieve a file from S3', async () => {
      const inputs = [
        {
          Body: 'document',
          Key: 'test-tenant/documents/document.txt',
          type: 'document',
          filename: 'document.txt',
        },
        {
          Body: 'attachment',
          Key: 'test-tenant/attachments/attachment.txt',
          type: 'attachment',
          filename: 'attachment.txt',
        },
        {
          Body: 'custom',
          Key: 'test-tenant/customUploads/custom.txt',
          type: 'custom',
          filename: 'custom.txt',
        },
        {
          Body: 'activitylog',
          Key: 'test-tenant/log/activitylog.txt',
          type: 'activitylog',
          filename: 'activitylog.txt',
        },
        {
          Body: 'thumbnail',
          Key: 'test-tenant/documents/thumbnail.txt',
          type: 'thumbnail',
          filename: 'thumbnail.txt',
        },
        {
          Body: 'segmentation',
          Key: 'test-tenant/documents/segmentation/segmentation.txt',
          type: 'segmentation',
          filename: 'segmentation.txt',
        },
        {
          Body: 'customPathFile',
          Key: 'test-tenant/documents/my/custom/path/customPathFile.txt',
          destination: 'my/custom/path',
          type: 'customPath',
          filename: 'customPathFile.txt',
        },
      ];

      const promises = inputs.map(async ({ Key, Body, type, filename, destination }) => {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: 'uwazi-development',
            Key,
            Body,
          })
        );

        const file = await s3fileStorage.getFile({
          filename,
          type: type as any,
          destination,
        });

        const content = await fileIO.asContentString(file);

        expect(content.getDataOrThrow()).toBe(Body);
      });

      await Promise.all(promises);
    });

    it('should throw an error if the file does not exist', async () => {
      const file = await s3fileStorage.getFile({
        filename: 'file_that_do_not_exist',
        type: 'document',
      });
      await expect(async () =>
        (await fileIO.asContentString(file)).getDataOrThrow()
      ).rejects.toThrow();
    });
  });

  describe('storeFile', () => {
    afterEach(async () => {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant/documents/file_created.txt',
        })
      );
    });

    it('should store it on s3 bucket', async () => {
      const document = FileBuilder.document(f.idString('document'), {
        content: FileBuilder.content('content created\n'),
        filename: 'documento.txt',
      });

      await s3fileStorage.storeFile(document);

      const s3File = await s3Client.send(
        new GetObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant/documents/documento.txt',
        })
      );

      expect(await toString(s3File)).toBe('content created\n');
    });

    // describe('when type is segmentation', () => {
    //   it('should store it on a segmentation folder inside documents path', async () => {
    //     await s3fileStorage.storeFile({
    //       file: new FileContents(testingFilesPath('documento.txt')),
    //       type: 'segmentation',
    //     });
    //
    //     const s3File = await s3Client.send(
    //       new GetObjectCommand({
    //         Bucket: 'uwazi-development',
    //         Key: 'test-tenant/documents/segmentation/documento.txt',
    //       })
    //     );
    //     expect(await toString(s3File)).toBe('content created\n');
    //   });
    // });
  });

  describe('removeContent', () => {
    it('should delete the file contents from s3', async () => {
      const document = FileBuilder.document(f.idString('document'), {
        content: FileBuilder.content('content created\n'),
        filename: 'documento.txt',
      });

      await s3fileStorage.storeFile(document);
      await s3fileStorage.removeContent('test-tenant/documents/documento.txt');

      await expect(async () =>
        s3Client.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'test-tenant/documents/documento.txt',
          })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    });
  });

  describe('removeFile', () => {
    it('should delete the file in s3', async () => {
      const document = FileBuilder.document(f.idString('document'), {
        content: FileBuilder.content('content created\n'),
        filename: 'documento.txt',
      });

      await s3fileStorage.storeFile(document);
      await s3fileStorage.removeFile(document);

      await expect(async () =>
        s3Client.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'test-tenant/documents/documento.txt',
          })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    });
  });

  describe('storeContent', () => {
    it('should store it on the destination', async () => {
      await s3fileStorage.storeContent(
        FileBuilder.content('content created\n'),
        'custom_path/deep/documento.txt'
      );

      const s3File = await s3Client.send(
        new GetObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'test-tenant/documents/custom_path/deep/documento.txt',
        })
      );
      expect(await toString(s3File)).toBe('content created\n');
    });
  });

  describe('fileExists', () => {
    it('should check if file exists', async () => {
      const doc = FileBuilder.document('docId', {
        content: FileBuilder.content('content'),
      });
      expect(await s3fileStorage.fileExists(doc)).toBe(false);

      await s3fileStorage.storeFile(doc);

      expect(await s3fileStorage.fileExists(doc)).toBe(true);
    });
  });

  describe('on Error', () => {
    const expectedMetadata = {
      requestId: 'mock-request-123',
      cfId: 'mock-cf-456',
      httpStatusCode: 500,
      attempts: 3,
      totalRetryDelay: 1000,
    };

    class MockS3Error extends Error {
      $metadata = expectedMetadata;

      constructor() {
        super('Mock S3 Error');
        this.name = 'S3ServiceError';
      }
    }
    const mockS3Client = TestUtils.mockClass<S3Client>({
      async send() {
        throw new MockS3Error();
      },
    });
    it('should wrap error with S3Error (getFile)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      const fileContents = await s3fileStorage.getFile({ type: 'document', filename: 'filename' });
      const iterable = fileContents.read()[Symbol.asyncIterator]();
      try {
        await iterable.next();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (storeFile)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.storeFile(FileBuilder.document('docId'));
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (storeContent)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.storeContent(FileBuilder.content('test content'), '/fake/path');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (fileExists)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.fileExists(FileBuilder.document('docId'));
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (removeFile)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.removeFile(FileBuilder.document('docId'));
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (removeContent)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.removeContent('/fake/path');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });

    it('should wrap error with S3Error (list)', async () => {
      s3fileStorage = new S3FileStorage(mockS3Client, new FileContentsIO(), tenant);
      try {
        await s3fileStorage.list();
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect(error.originalError.$metadata).toEqual(expectedMetadata);
        expect(error.httpStatusCode).toBe(500);
      }
    });
  });
});
