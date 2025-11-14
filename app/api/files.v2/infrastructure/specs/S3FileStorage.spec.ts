import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { Attachment } from 'api/files.v2/model/Attachment';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { FileBuilder } from 'api/files.v2/specs/FileBuilder';
import { Tenant } from 'api/tenants/tenantContext';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingTenants } from 'api/utils/testingTenants';
import path from 'node:path';
import { Readable } from 'node:stream';
import { S3FileStorage } from '../S3FileStorage';

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
      (s3File.Body as Readable).on('end', () => resolve(Buffer.concat(_buf)));
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
        file: new ProcessedDocument({
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
          content: new DiskFile('fake/path').toContent(),
        }),
        expected: 'test-tenant/documents/document',
      },
      {
        file: new Attachment({
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

  const testingFilesPath = (filename: string) =>
    path.join(__dirname, '../../../files/specs/testing_files', filename);

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
        content: new DiskFile(testingFilesPath('documento.txt')).toContent(),
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

  describe('storeContent', () => {
    it('should store it on the destination', async () => {
      await s3fileStorage.storeContent(
        new DiskFile(testingFilesPath('documento.txt')).toContent(),
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
});
