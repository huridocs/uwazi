import { CreateBucketCommand, DeleteBucketCommand, DeleteObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { S3FileStorage } from '../S3FileStorage';

describe('S3FileStorage', () => {
  let s3Client: S3Client;
  let s3fileStorage: S3FileStorage;

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
    s3fileStorage = new S3FileStorage(s3Client);
  });

  afterAll(async () => {
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

  describe('listFiles', () => {
    it('should list all files on s3', async () => {
      await s3Client.send(
        new PutObjectCommand({ Bucket: 'uwazi-development', Key: 'test', Body: 'body' })
      );

      const listedFiles = await s3fileStorage.list();

      expect(listedFiles.sort()).toEqual(
        [
          'test',
          // 'tenant1/customUploads/file_created1.txt',
          // 'tenant1/uploads/already_uploaded.txt',
          // 'tenant1/uploads/file_to_be_deleted.txt',
          // 'tenant1/uploads/segmentation/file_created.txt',
        ].sort()
      );
    });
  });
});
