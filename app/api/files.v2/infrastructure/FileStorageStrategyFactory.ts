import { S3Client } from '@aws-sdk/client-s3';

import { tenants } from '../tenants.js';
import { config } from '../config.js';

import { FileSystemStorage } from './FileSystemStorage';
import { PathManager } from './PathManager';
import { S3FileStorage } from './S3FileStorage';
import { FileStorageStrategy } from '../contracts/FileStorageStrategy';

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
