import {
  _Object,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { BaseFile } from 'api/core/domain/files/BaseFile';
import { FileWithContents } from 'api/core/domain/files/FileWithContents';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { S3Error } from 'api/files/S3Storage';
import { Tenant } from 'api/tenants/tenantContext';
import path from 'path';
import { Readable } from 'stream';
import { FileStorage, GetFileInput } from '../../application/contracts/FileStorage';
import { FileAttachment } from '../../domain/files/FileAttachment';
import { CustomUpload } from '../../domain/files/CustomUpload';
import { FileContents } from '../../domain/files/FileContents';
import { StoredFile } from '../../domain/files/StoredFile';
import { URLAttachment } from '../../domain/files/URLAttachment';
import { PathManager } from './PathManager';

const catchS3Errors = async <T>(cb: () => Promise<T>): Promise<T> => {
  try {
    return await cb();
  } catch (err) {
    throw new S3Error(err);
  }
};

export class S3FileStorage implements FileStorage {
  private bucket = config.s3.bucket;

  private s3Client: S3Client;

  private tenant: Tenant;

  private pathManager: PathManager;

  private fileIO: FileContentsIO;

  constructor(s3Client: S3Client, fileIO: FileContentsIO, tenant: Tenant) {
    this.s3Client = s3Client;
    this.tenant = tenant;
    this.fileIO = fileIO;
    this.pathManager = new PathManager({ tenant });
  }

  async storeContent(content: FileContents, subpath: string): Promise<void> {
    await catchS3Errors(async () =>
      this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.pathManager.createPath({
            filename: path.basename(subpath),
            destination: path.dirname(subpath),
            type: 'customPath',
          }),
          Body: (await this.fileIO.toBuffer(content)).getDataOrThrow(),
        })
      )
    );
  }

  async storeFile(file: FileWithContents) {
    await catchS3Errors(async () =>
      this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.pathManager.createPath(file),
          Body: (await this.fileIO.toBuffer(file.content)).getDataOrThrow(),
        })
      )
    );
  }

  async removeFile(file: FileWithContents) {
    await catchS3Errors(async () =>
      this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.pathManager.createPath(file),
        })
      )
    );
  }

  async removeContent(filePath: string) {
    await catchS3Errors(async () =>
      this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
        })
      )
    );
  }

  getFile(input: GetFileInput): FileContents {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.pathManager.createPath(input),
    });

    const client = this.s3Client;

    const fileContents = new FileContents(async function* streamCallback() {
      const stream = (await catchS3Errors(async () => client.send(command))).Body as Readable;
      for await (const chunk of stream) {
        yield chunk;
      }
    });

    fileContents.setReadable(
      async () => (await catchS3Errors(async () => client.send(command))).Body as Readable
    );

    return fileContents;
  }

  async getFiles(inputs: GetFileInput[]) {
    const promises = inputs.map(async input => this.getFile(input));

    return Promise.all(promises);
  }

  async fileExists(file: BaseFile) {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.pathManager.createPath(file),
        })
      );
    } catch (e) {
      if (e instanceof NotFound) {
        return false;
      }
      throw new S3Error(e);
    }
    return true;
  }

  getPath(file: BaseFile): string {
    if (file instanceof FileAttachment) {
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
      const response = await catchS3Errors(async () =>
        this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: config.s3.bucket,
            Prefix: `${this.tenant.name}/`,
            ContinuationToken: token,
            MaxKeys: config.s3.batchSize,
          })
        )
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
