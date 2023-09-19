import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
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

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: S3Storage.bucketName(),
        Key: key,
      })
    );
  }
}
