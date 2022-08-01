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
import { Readable } from 'stream';
import { setupTestUploadedPaths, streamToString } from '../filesystem';
import { fileContents } from '../storage';

let s3: S3Client;

describe('storage with s3 feature active', () => {
  beforeAll(async () => {
    config.s3 = {
      endpoint: 'http://192.168.1.223:9000',
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
  });

  beforeEach(async () => {
    await s3.send(new CreateBucketCommand({ Bucket: 'uwazi-development' }));
    await s3.send(new CreateBucketCommand({ Bucket: 'another-tenant' }));
  }, 20000);

  afterEach(async () => {
    await s3.send(
      new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
    );
    await s3.send(new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/' }));
    await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
    await s3.send(new DeleteBucketCommand({ Bucket: 'another-tenant' }));
  }, 20000);

  describe('readableFile when s3 feature active', () => {
    it('should store it on the s3 bucket and then return it as a readable', async () => {
      testingTenants.mockCurrentTenant({
        name: 'uwazi_development',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: {
          s3Storage: true,
        },
      });
      await setupTestUploadedPaths();

      await expect((await fileContents('test_s3_file.txt', 'document')).toString()).toMatch(
        'test content'
      );

      const response = await s3.send(
        new GetObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
      );
      await expect((await streamToString(response.Body as Readable)).toString()).toMatch(
        'test content'
      );
    }, 20000);
  });

  describe('readableFile when s3 feature not active', () => {
    it('should not store it on s3', async () => {
      testingTenants.mockCurrentTenant({
        name: 'another-tenant',
        dbName: 'another-tenant',
        indexName: 'index',
      });
      await setupTestUploadedPaths();

      await expect((await fileContents('test_s3_file.txt', 'document')).toString()).toMatch(
        'test content'
      );

      await expect(async () =>
        s3.send(
          new GetObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    }, 20000);
  });
});
