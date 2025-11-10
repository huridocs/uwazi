import {
  _Object,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { Tenant } from 'api/tenants/tenantContext';
import path from 'path';
import { Readable } from 'stream';
import { FileStorage, GetFileInput, UploadFileInput } from '../contracts/FileStorage';
import { Attachment } from '../model/Attachment';
import { CustomUpload } from '../model/CustomUpload';
import { FileContents } from '../model/FileContents';
import { StoredFile } from '../model/StoredFile';
import { URLAttachment } from '../model/URLAttachment';
import { UwaziFile } from '../model/UwaziFile';
import { PathManager } from './PathManager';

export class S3FileStorage implements FileStorage {
  private bucket = config.s3.bucket;

  private s3Client: S3Client;

  private tenant: Tenant;

  private pathManager: PathManager;

  constructor(s3Client: S3Client, tenant: Tenant) {
    this.s3Client = s3Client;
    this.tenant = tenant;
    this.pathManager = new PathManager({ tenant });
  }

  async storeFile(input: UploadFileInput) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.pathManager.createPath({
          filename: input.file.filename,
          type: input.type,
          destination: input.destination,
        }),
        Body: (await input.file.toBuffer()).getDataOrThrow(),
      })
    );
  }

  async getFile(input: GetFileInput) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.pathManager.createPath(input),
    });

    return new FileContents({
      readableCallback: async () => (await this.s3Client.send(command)).Body as Readable,
      filename: input.filename,
    });
  }

  async getFiles(inputs: GetFileInput[]) {
    const promises = inputs.map(async input => this.getFile(input));

    return Promise.all(promises);
  }

  getPath(file: UwaziFile): string {
    if (file instanceof Attachment) {
      return path.join(this.tenant.attachments, file.filename);
    }
    if (file instanceof CustomUpload) {
      return path.join(this.tenant.customUploads, file.filename);
    }
    if (file instanceof URLAttachment) {
      return 'not implemented';
    }
    return path.join(this.tenant.uploadedDocuments, file.filename);
  }

  async list() {
    const objects: _Object[] = [];
    const requestNext = async (token?: string) => {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: config.s3.bucket,
          Prefix: `${this.tenant.name}/`,
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

    return objects.map(c => new StoredFile(c.Key!, c.LastModified, c.ETag!));
  }
}
