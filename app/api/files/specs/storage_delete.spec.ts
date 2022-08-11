import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { testingTenants } from 'api/utils/testingTenants';
import { Readable } from 'stream';
import { fileExistsOnPath, setupTestUploadedPaths, uploadsPath } from '../filesystem';
import { storage } from '../storage';

let s3: S3Client;

describe('storage with s3 feature active', () => {
  beforeAll(async () => {
    config.s3 = {
      endpoint: 'http://127.0.0.1:9000',
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    };

    s3 = new S3Client({
      apiVersion: 'latest',
      region: 'uwazi-development',
      forcePathStyle: true, // needed for minio
      ...config.s3,
    });
    await s3.send(new CreateBucketCommand({ Bucket: 'storage-delete' }));
  });

  beforeEach(async () => {
    testingTenants.mockCurrentTenant({
      name: 'storage-delete',
      dbName: 'uwazi_development',
      indexName: 'index',
      featureFlags: {
        s3Storage: true,
      },
    });
    await setupTestUploadedPaths();

    await storage.storeFile(
      'file_to_be_deleted.txt',
      Readable.from(['to delete content']),
      'document'
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: 'storage-delete',
        Key: 'uploads/file_to_be_deleted.txt',
        Body: Buffer.from('to delete content'),
      })
    );
  });

  afterAll(async () => {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: 'storage-delete',
        Key: 'uploads/file_to_be_deleted.txt',
      })
    );
    await s3.send(new DeleteBucketCommand({ Bucket: 'storage-delete' }));
  });

  describe('removeFile when s3 feature active', () => {
    it('should remove it from disk and s3 bucket', async () => {
      await storage.removeFile('file_to_be_deleted.txt', 'document');
      expect(await fileExistsOnPath(uploadsPath('file_to_be_deleted.txt'))).toBe(false);
      await expect(async () =>
        s3.send(
          new GetObjectCommand({
            Bucket: 'storage-delete',
            Key: 'uploads/file_to_be_deleted.txt',
          })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    });
  });

  describe('removeFile when s3 feature is not active', () => {
    it('should remove it from disk, not from s3 bucket', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: false } });
      await storage.removeFile('file_to_be_deleted.txt', 'document');
      expect(await fileExistsOnPath(uploadsPath('file_to_be_deleted.txt'))).toBe(false);
      const s3FileContents = await s3.send(
        new GetObjectCommand({
          Bucket: 'storage-delete',
          Key: 'uploads/file_to_be_deleted.txt',
        })
      );
      expect(s3FileContents).toBeDefined();
    });
  });
});
