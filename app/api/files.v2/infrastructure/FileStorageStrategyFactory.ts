import { tenants } from 'api/tenants';

import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { buildS3Client } from 'api/infrastructure/S3Client';
import { FileStorageStrategy } from '../contracts/FileStorageStrategy';
import { FileSystemStorage } from './FileSystemStorage';
import { PathManager } from './PathManager';
import { S3FileStorage } from './S3FileStorage';

export class FileStorageStrategyFactory {
  static createDefault() {
    const tenant = tenants.current();

    const s3Storage = new S3FileStorage(buildS3Client(), new FileContentsIO(), tenant);

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
