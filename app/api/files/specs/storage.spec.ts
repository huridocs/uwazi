import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { testingTenants } from 'api/utils/testingTenants';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { Readable } from 'stream';
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
      bucket: 'uwazi-development',
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
      name: 'tenant1',
      dbName: 'uwazi_development',
      indexName: 'index',
    });
    await setupTestUploadedPaths();
  });

  afterAll(async () => {
    const allBucketKeys = (
      (
        await s3.send(
          new ListObjectsCommand({
            Bucket: 'uwazi-development',
          })
        )
      ).Contents || []
    ).map(content => content.Key);

    await Promise.all(
      allBucketKeys.map(async key =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: 'uwazi-development',
            Key: key,
          })
        )
      )
    );
    await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
    s3.destroy();
  });

  describe('readableFile', () => {
    describe('readableFile when s3 feature active', () => {
      beforeAll(async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: true } });
      });

      it('should return a file from s3 when it is already there', async () => {
        await s3.send(
          new PutObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'tenant1/uploads/already_uploaded.txt',
            Body: Buffer.from('already uploaded content', 'utf-8'),
          })
        );

        await expect(
          (await storage.fileContents('already_uploaded.txt', 'document')).toString()
        ).toMatch('already uploaded content');
      });

      it('should throw an error when file does not exists', async () => {
        await expect(storage.fileContents('test_s3_file.txt', 'document')).rejects.toBeInstanceOf(
          Error
        );
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
            new GetObjectCommand({
              Bucket: 'uwazi-development',
              Key: 'another-tenant/uploads/test_s3_file.txt',
            })
          )
        ).rejects.toBeInstanceOf(NoSuchKey);
      });
    });
  });

  describe('removeFile', () => {
    beforeEach(async () => {
      await storage.storeFile(
        'file_to_be_deleted.txt',
        Readable.from([Buffer.from('to delete content')]),
        'document'
      );

      testingTenants.changeCurrentTenant({
        name: 'tenant1',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: { s3Storage: true },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'tenant1/uploads/file_to_be_deleted.txt',
          Body: Buffer.from('to delete content'),
        })
      );
    });

    describe('removeFile when s3 feature active', () => {
      it('should remove it from s3 bucket', async () => {
        await storage.removeFile('file_to_be_deleted.txt', 'document');

        await expect(async () =>
          s3.send(
            new GetObjectCommand({
              Bucket: 'uwazi-development',
              Key: 'tenant1/uploads/file_to_be_deleted.txt',
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
            Key: 'tenant1/uploads/file_to_be_deleted.txt',
          })
        );
        expect(s3FileContents).toBeDefined();
      });
    });
  });

  describe('storeFile', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'tenant1',
        dbName: 'uwazi_development',
        indexName: 'index',
        featureFlags: {
          s3Storage: true,
        },
      });
    });

    afterEach(async () => {
      await deleteFile(uploadsPath('file_created.txt'));
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'uwazi-development',
          Key: 'tenant1/uploads/file_created.txt',
        })
      );
    });

    describe('when s3 feature active', () => {
      it('should store it on s3 bucket', async () => {
        await storage.storeFile(
          'file_created.txt',
          createReadStream(uploadsPath('documento.txt')),
          'document'
        );

        const s3File = await s3.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'tenant1/uploads/file_created.txt',
          })
        );
        // @ts-ignore
        expect(await streamToString(s3File.Body)).toBe('content created\n');
      });
    });

    describe('when type is segmentation', () => {
      it('should store it on a segmentation folder inside uploads path', async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: true } });
        await storage.storeFile(
          'file_created.txt',
          createReadStream(uploadsPath('documento.txt')),
          'segmentation'
        );

        const s3File = await s3.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'tenant1/uploads/segmentation/file_created.txt',
          })
        );
        // @ts-ignore
        expect(await streamToString(s3File.Body)).toBe('content created\n');
      });
    });

    describe('when s3 feature is not active', () => {
      it('should store it on disk', async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { s3Storage: false } });

        await storage.storeFile('file_created.txt', Readable.from(['content created']), 'document');

        expect(await streamToString(createReadStream(uploadsPath('file_created.txt')))).toBe(
          'content created'
        );
        await expect(async () =>
          s3.send(
            new GetObjectCommand({
              Bucket: 'uwazi-development',
              Key: 'tenant1/uploads/file_created.txt',
            })
          )
        ).rejects.toBeInstanceOf(NoSuchKey);
      });
    });
  });

  describe('fileExists', () => {
    afterEach(async () => {
      await storage.removeFile('file_created.txt', 'document');
    });

    describe('when s3 flag is active', () => {
      it('should check if object exists on s3', async () => {
        testingTenants.changeCurrentTenant({
          name: 'tenant1',
          dbName: 'uwazi_development',
          indexName: 'index',
          featureFlags: {
            s3Storage: true,
          },
        });
        await storage.storeFile(
          'file_created.txt',
          createReadStream(uploadsPath('documento.txt')),
          'document'
        );
        expect(await storage.fileExists('file_created.txt', 'document')).toBe(true);
        expect(await storage.fileExists('non_existent.txt', 'document')).toBe(false);
      });
    });

    describe('when s3 flag is not active', () => {
      it('should check if object exists on disk', async () => {
        testingTenants.changeCurrentTenant({
          name: 'tenant1',
          dbName: 'uwazi_development',
          indexName: 'index',
          featureFlags: {
            s3Storage: false,
          },
        });
        await storage.storeFile(
          'file_created.txt',
          createReadStream(uploadsPath('documento.txt')),
          'document'
        );
        expect(await storage.fileExists('file_created.txt', 'document')).toBe(true);
        expect(await storage.fileExists('non_existent.txt', 'document')).toBe(false);
      });
    });
  });
});
