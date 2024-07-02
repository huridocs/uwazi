import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  _Object,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { config } from 'api/config';

export class S3Storage {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      requestHandler: new NodeHttpHandler({
        socketTimeout: 30000,
      }),
      apiVersion: 'latest',
      region: 'placeholder-region',
      endpoint: config.s3.endpoint,
      credentials: config.s3.credentials,
      forcePathStyle: true,
    });
  }

  static bucketName() {
    return config.s3.bucket;
  }

  async upload(key: string, body: Buffer) {
    return this.client.send(
      new PutObjectCommand({ Bucket: S3Storage.bucketName(), Key: key, Body: body })
    );
  }

  async get(key: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: S3Storage.bucketName(),
        Key: key,
      })
    );

    return response;
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

    let continuationToken = await requestNext();
    while (continuationToken) {
      // eslint-disable-next-line no-await-in-loop
      continuationToken = await requestNext(continuationToken);
    }

    return objects;
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: S3Storage.bucketName(),
        Key: key,
      })
    );
  }
}
