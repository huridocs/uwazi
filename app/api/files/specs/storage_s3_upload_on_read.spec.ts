import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { Readable } from 'stream';
import { fs } from '..';
import { streamToString } from '../filesystem';
import { fileContents, readableFile } from '../storage';

const s3 = new S3Client({
  apiVersion: 'latest',
  region: 'uwazi-development',
  endpoint: 'http://192.168.1.223:9000',
  credentials: {
    accessKeyId: 'YTmqw9gKSqfRDjFC',
    secretAccessKey: 'OUHB77FxYB2DUCmmsfi8ZeUK6juClJru',
  },
  forcePathStyle: true, // needed for minio
});

describe('storage with s3 feature active', () => {
  beforeEach(async () => {
    await testingEnvironment.setTenant();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: 'uwazi-development',
        Key: 'test_s3_file.txt',
      })
    );
  });

  afterEach(async () => {});

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
