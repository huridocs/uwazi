import { S3Client } from '@aws-sdk/client-s3';

// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
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
