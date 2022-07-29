import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { Readable } from 'stream';
import { streamToString } from '../filesystem';
import { fileContents } from '../storage';

let s3: S3Client;

describe('storage with s3 feature active', () => {
  beforeEach(async () => {
    await testingEnvironment.setTenant('uwazi_development');
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

    await s3.send(new CreateBucketCommand({ Bucket: 'uwazi-development' }));
  });

  afterEach(async () => {
    await s3.send(
      new DeleteObjectCommand({ Bucket: 'uwazi-development', Key: 'test_s3_file.txt' })
    );
    await s3.send(new DeleteBucketCommand({ Bucket: 'uwazi-development' }));
  });

  describe('readableFile', () => {
    describe('when file is not stored on s3 bucket', () => {
      it('should store it and then return it as a readable', async () => {
        await expect((await fileContents('test_s3_file.txt', 'document')).toString()).toMatch(
          'test content'
        );

        const response = await s3.send(
          new GetObjectCommand({
            Bucket: 'uwazi-development',
            Key: 'test_s3_file.txt',
          })
        );

        await expect((await streamToString(response.Body as Readable)).toString()).toMatch(
          'test content'
        );
      });
    });
  });
});
