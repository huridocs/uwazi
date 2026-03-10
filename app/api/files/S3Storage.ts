import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  _Object,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';

class S3Error extends Error {
  constructor(cause: S3ServiceException) {
    super(cause.message, { cause });
  }

  get originalError() {
    return this.cause as S3ServiceException;
  }

  get httpStatusCode() {
    return this.originalError?.$metadata?.httpStatusCode || 503;
  }
}

const catchS3Errors = async <T>(cb: () => Promise<T>): Promise<T> => {
  try {
    return await cb();
  } catch (err) {
    throw new S3Error(err);
  }
};

export class S3Storage {
  private client: S3Client;

  constructor(s3Client: S3Client) {
    this.client = s3Client;
  }

  destroy() {
    this.client.destroy();
  }

  static bucketName() {
    return config.s3.bucket;
  }

  async upload(key: string, body: Buffer) {
    return catchS3Errors(async () =>
      this.client.send(
        new PutObjectCommand({ Bucket: S3Storage.bucketName(), Key: key, Body: body })
      )
    );
  }

  async head(key: string) {
    return catchS3Errors(async () =>
      this.client.send(
        new HeadObjectCommand({
          Bucket: S3Storage.bucketName(),
          Key: key,
        })
      )
    );
  }

  async get(key: string) {
    return catchS3Errors(async () =>
      this.client.send(
        new GetObjectCommand({
          Bucket: S3Storage.bucketName(),
          Key: key,
        })
      )
    );
  }

  async list(prefix?: string) {
    const objects: _Object[] = [];
    const requestNext = async (token?: string) => {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: S3Storage.bucketName(),
          Prefix: prefix,
          ContinuationToken: token,
          MaxKeys: config.s3.batchSize,
        })
      );
      objects.push(...(response.Contents || []));
      return response.NextContinuationToken;
    };

    return catchS3Errors(async () => {
      let continuationToken = await requestNext();
      while (continuationToken) {
        // eslint-disable-next-line no-await-in-loop
        continuationToken = await requestNext(continuationToken);
      }
      return objects;
    });
  }

  async delete(key: string) {
    return catchS3Errors(async () =>
      this.client.send(
        new DeleteObjectCommand({
          Bucket: S3Storage.bucketName(),
          Key: key,
        })
      )
    );
  }
}

export { S3Error };
