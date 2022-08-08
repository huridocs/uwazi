import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import waitForExpect from 'wait-for-expect';
import { config } from 'api/config';
import { testingTenants } from 'api/utils/testingTenants';
import { Readable } from 'stream';
import { setupTestUploadedPaths, streamToString } from '../filesystem';
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
  });

  beforeEach(async () => {
    await s3.send(new CreateBucketCommand({ Bucket: 'uwazi-development' }));
    await s3.send(new CreateBucketCommand({ Bucket: 'another-tenant' }));
  });

  afterEach(async () => {
    await s3.send(
      new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
    );
    await s3.send(
      new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/already_uploaded.txt' })
    );
    await s3.send(new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/' }));
    await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
    await s3.send(new DeleteBucketCommand({ Bucket: 'another-tenant' }));
  });

  describe('readableFile when s3 feature active', () => {
    beforeAll(async () => {
      testingTenants.mockCurrentTenant({
        name: 'uwazi_development',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: {
          s3Storage: true,
        },
      });
      await setupTestUploadedPaths();
    });

    it('should store it on the s3 bucket and then return it as a readable', async () => {
      await expect((await storage.fileContents('test_s3_file.txt', 'document')).toString()).toMatch(
        'test content'
      );

      await waitForExpect(async () => {
        const response = await s3.send(
          new GetObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
        );
        await expect((await streamToString(response.Body as Readable)).toString()).toMatch(
          'test content'
        );
      });
    });

    it('should return a file from s3 when it is already there', async () => {
      await s3.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'uploads/already_uploaded.txt',
          Body: Buffer.from('already uploaded content', 'utf-8'),
        })
      );
      await expect(
        (await storage.fileContents('already_uploaded.txt', 'document')).toString()
      ).toMatch('already uploaded content');
    });
  });

  describe('readableFile when s3 feature not active', () => {
    it('should not store it on s3', async () => {
      testingTenants.mockCurrentTenant({
        name: 'another-tenant',
        dbName: 'another-tenant',
        indexName: 'index',
      });
      await setupTestUploadedPaths();

      await expect((await storage.fileContents('test_s3_file.txt', 'document')).toString()).toMatch(
        'test content'
      );

      await expect(async () =>
        s3.send(
          new GetObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
        )
      ).rejects.toBeInstanceOf(NoSuchKey);
    });
  });
});
