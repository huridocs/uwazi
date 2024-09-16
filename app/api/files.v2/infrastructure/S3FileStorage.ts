import { _Object, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { Tenant } from 'api/tenants/tenantContext';
import path from 'path';
import { FileStorage } from '../contracts/FileStorage';
import { Attachment } from '../model/Attachment';
import { UwaziFile } from '../model/UwaziFile';
import { URLAttachment } from '../model/URLAttachment';
import { CustomUpload } from '../model/CustomUpload';

export class S3FileStorage implements FileStorage {
  private s3Client: S3Client;

  private tenant: Tenant;

  constructor(s3Client: S3Client, tenant: Tenant) {
    this.s3Client = s3Client;
    this.tenant = tenant;
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

  async list(): Promise<string[]> {
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

    return objects.map(c => c.Key!);
  }
}
