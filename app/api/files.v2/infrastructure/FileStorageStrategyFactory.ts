import { S3Client } from '@aws-sdk/client-s3';

import { tenants } from '#api/tenants/index.js';

import { config } from '#api/config.js';

import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { S3FileStorage } from '#api/files.v2/infrastructure/S3FileStorage.js';
import { FileStorageStrategy } from '#api/files.v2/contracts/FileStorageStrategy.js';

export class FileStorageStrategyFactory {
  static createDefault() {
    const tenant = tenants.current();

    const s3Storage = new S3FileStorage(
      new S3Client({
        apiVersion: 'latest',
        region: 'region',
        ...config.s3,
      }),
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
