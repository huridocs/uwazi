import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { Attachment } from 'api/files.v2/model/Attachment';
import { Document } from 'api/files.v2/model/Document';
import { testingTenants } from 'api/utils/testingTenants';
import { Tenant } from 'api/tenants/tenantContext';
import { S3FileStorage } from '../S3FileStorage';

describe('S3FileStorage', () => {
  let s3Client: S3Client;
  let s3fileStorage: S3FileStorage;
  let tenant: Tenant;

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

    s3fileStorage = new S3FileStorage(s3Client, tenant);
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

      expect(listedFiles.map(f => f.fullPath).sort()).toEqual(
        ['test-tenant/documents/document1', 'test-tenant/documents/document2'].sort()
      );
    });
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

      const listedFiles = await s3fileStorage.list();

      expect(listedFiles.map(f => f.fullPath).sort()).toEqual(
        ['test-tenant/documents/document1', 'test-tenant/documents/document2'].sort()
      );
    });
  });

  describe('getPath', () => {
    it.each([
      {
        file: new Document('id', 'entity', 1, 'document', 'ab'),
        expected: 'test-tenant/documents/document',
      },
      {
        file: new Attachment('id', 'entity', 1, 'attachment'),
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
      ];

      const promises = inputs.map(async ({ Key, Body, type, filename }) => {
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
        });

        const content = await file.asContentString();

        expect(content).toBe(Body);
      });

      await Promise.all(promises);
    });

    it('should throw an error if the file does not exist', async () => {
      await expect(
        s3fileStorage.getFile({ filename: 'file_that_do_not_exist', type: 'document' })
      ).rejects.toThrow();
    });
  });
});
