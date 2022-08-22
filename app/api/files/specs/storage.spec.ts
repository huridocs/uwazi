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
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import waitForExpect from 'wait-for-expect';
import {
  deleteFile,
  fileExistsOnPath,
  setupTestUploadedPaths,
  streamToString,
  uploadsPath,
} from '../filesystem';
import { storage } from '../storage';

let s3: S3Client;

describe('storage', () => {
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
      region: 'region',
      forcePathStyle: true, // needed for minio
      ...config.s3,
    });
    await s3.send(new CreateBucketCommand({ Bucket: 'uwazi-development' }));
    testingTenants.mockCurrentTenant({
      name: 'uwazi_development',
      dbName: 'uwazi_development',
      indexName: 'index',
    });
    await setupTestUploadedPaths();
  });

  afterAll(async () => {
    await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
  });

  describe('readableFile', () => {
    beforeEach(async () => {
      await s3.send(new CreateBucketCommand({ Bucket: 'another-tenant' }));
    });
    afterEach(async () => {
      await s3.send(
        new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
      );
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'uploads/already_uploaded.txt',
        })
      );
      await s3.send(new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/' }));
      await s3.send(new DeleteBucketCommand({ Bucket: 'another-tenant' }));
    });

    describe('readableFile when s3 feature active', () => {
      beforeAll(async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: true } });
      });

      it('should store it on the s3 bucket and then return it as a readable', async () => {
        await expect(
          (await storage.fileContents('test_s3_file.txt', 'document')).toString()
        ).toMatch('test content');
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
        testingTenants.changeCurrentTenant({
          name: 'another-tenant',
          dbName: 'another-tenant',
          indexName: 'index',
          featureFlags: {
            s3Storage: false,
          },
        });

        await expect(
          (await storage.fileContents('test_s3_file.txt', 'document')).toString()
        ).toMatch('test content');
        await expect(async () =>
          s3.send(
            new GetObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/test_s3_file.txt' })
          )
        ).rejects.toBeInstanceOf(NoSuchKey);
      });
    });
  });

  describe('removeFile', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'uwazi_development',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: { s3Storage: true },
      });

      await storage.storeFile(
        'file_to_be_deleted.txt',
        Readable.from(['to delete content']),
        'document'
      );

      await s3.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'uploads/file_to_be_deleted.txt',
          Body: Buffer.from('to delete content'),
        })
      );
    });

    afterAll(async () => {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'uploads/file_to_be_deleted.txt',
        })
      );
    });

    describe('removeFile when s3 feature active', () => {
      it('should remove it from disk and s3 bucket', async () => {
        await storage.removeFile('file_to_be_deleted.txt', 'document');

        expect(await fileExistsOnPath(uploadsPath('file_to_be_deleted.txt'))).toBe(false);
        await expect(async () =>
          s3.send(
            new GetObjectCommand({
              Bucket: 'uwazi-development',
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
            Bucket: 'uwazi-development',
            Key: 'uploads/file_to_be_deleted.txt',
          })
        );
        expect(s3FileContents).toBeDefined();
      });
    });
  });

  describe('storeFile', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'uwazi_development',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: {
          s3Storage: true,
        },
      });
    });

    afterAll(async () => {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'uploads/file_created.txt',
        })
      );
      await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
    });

    afterEach(async () => {
      await deleteFile(uploadsPath('file_created.txt'));
      await s3.send(
        new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'uploads/file_created.txt' })
      );
    });

    describe('when s3 feature active', () => {
      it('should store it on disk and on s3 bucket', async () => {
        await storage.storeFile(
          'file_created.txt',
          createReadStream(uploadsPath('documento.txt')),
          'document'
        );

        expect(await streamToString(createReadStream(uploadsPath('file_created.txt')))).toBe(
          'content created\n'
        );
        const s3File = await s3.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'uploads/file_created.txt',
          })
        );
        // @ts-ignore
        expect(await streamToString(s3File.Body)).toBe('content created\n');
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
              Bucket: 'uwazi-development',
              Key: 'uploads/file_created.txt',
            })
          )
        ).rejects.toBeInstanceOf(NoSuchKey);
      });
    });
  });
});
