import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { tenants } from 'api/tenants';

export class S3Storage {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      apiVersion: 'latest',
      region: 'placeholder-region',
      endpoint: config.s3.endpoint,
      credentials: config.s3.credentials,
      forcePathStyle: true,
    });
  }

  static bucketName() {
    return tenants.current().name.replace('_', '-');
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
