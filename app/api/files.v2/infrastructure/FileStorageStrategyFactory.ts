import { S3Client } from '@aws-sdk/client-s3';

import { tenants } from 'api/tenants';
import { config } from 'api/config';

import { FileSystemStorage } from './FileSystemStorage';
import { PathManager } from './PathManager';
import { S3FileStorage } from './S3FileStorage';
import { FileStorageStrategy } from '../contracts/FileStorageStrategy';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';

export class FileStorageStrategyFactory {
  static createDefault() {
    const tenant = tenants.current();

    const s3Storage = new S3FileStorage(
      new S3Client({
        apiVersion: 'latest',
        region: 'region',
        ...config.s3,
      }),
      new FileContentsIO(),
      tenant
    );

    const fileSystemStorage = new FileSystemStorage(new PathManager({ tenant }));

    return new FileStorageStrategy({
      tenant,
      strategy: {
        s3Storage,
        fileSystemStorage,
      },
    });
  }
}
