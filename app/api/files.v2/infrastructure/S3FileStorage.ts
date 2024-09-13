import { _Object, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { FileStorage } from '../contracts/FileStorage';
import { UwaziFile } from '../model/UwaziFile';
import { prefix } from '@fortawesome/free-solid-svg-icons';
import { S3Storage } from 'api/files/S3Storage';
import { config } from 'api/config';

export class S3FileStorage implements FileStorage {
  private s3Client: S3Client;

  constructor(s3Client: S3Client) {
    this.s3Client = s3Client;
  }

  // eslint-disable-next-line class-methods-use-this
  getPath(file: UwaziFile): string {
    return `document/${file.filename}`;
  }

  // eslint-disable-next-line class-methods-use-this
  async list(): Promise<string[]> {
    const objects: _Object[] = [];
    const requestNext = async (token?: string) => {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: 'uwazi-development',
          // Prefix: prefix,
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
      // const results = await s3().list(tenants.current().name);
      // return results.map(c => c.Key!);
  }
}
