import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { testingTenants } from 'api/utils/testingTenants';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { deleteFile, setupTestUploadedPaths, streamToString, uploadsPath } from '../filesystem';
import { storage } from '../storage';

let s3: S3Client;

describe('storage storeFile', () => {
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
    await s3.send(new CreateBucketCommand({ Bucket: 'storage-store' }));
  });

  beforeEach(async () => {
    testingTenants.mockCurrentTenant({
      name: 'storage_store',
      dbName: 'uwazi_development',
      indexName: 'index',
      featureFlags: {
        s3Storage: true,
      },
    });
    await setupTestUploadedPaths();
  });

  afterAll(async () => {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: 'storage-store',
        Key: 'uploads/file_created.txt',
      })
    );
    await s3.send(new DeleteBucketCommand({ Bucket: 'storage-store' }));
  });

  afterEach(async () => {
    await deleteFile(uploadsPath('file_created.txt'));
    await s3.send(
      new DeleteObjectCommand({ Bucket: 'storage-store', Key: 'uploads/file_created.txt' })
    );
  });

  describe('when s3 feature active', () => {
    it('should store it on disk and on s3 bucket', async () => {
      await storage.storeFile('file_created.txt', Readable.from(['content created']), 'document');
      expect(await streamToString(createReadStream(uploadsPath('file_created.txt')))).toBe(
        'content created'
      );
      const s3File = await s3.send(
        new GetObjectCommand({
          Bucket: 'storage-store',
          Key: 'uploads/file_created.txt',
        })
      );

      // @ts-ignore
      expect(await streamToString(s3File.Body)).toBe('content created');
    });
  });

  describe('when s3 feature is not active', () => {
    it('should store it on disk and not on s3 bucket', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: false } });
      await storage.storeFile('file_created.txt', Readable.from(['content created']), 'document');
      expect(await streamToString(createReadStream(uploadsPath('file_created.txt')))).toBe(
        'content created'
      );

      await expect(async () =>
        s3.send(
          new GetObjectCommand({
            Bucket: 'storage-store',
            Key: 'uploads/file_created.txt',
          })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    });
  });
});
