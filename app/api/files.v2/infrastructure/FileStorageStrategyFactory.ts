import { S3Client } from '@aws-sdk/client-s3';


import { tenants } from 'api/tenants/index.js';

import { config } from '../config.js';

import { FileSystemStorage } from './FileSystemStorage.js';
import { PathManager } from './PathManager.js';
import { S3FileStorage } from './S3FileStorage.js';
import { FileStorageStrategy } from '../contracts/FileStorageStrategy.js';

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
