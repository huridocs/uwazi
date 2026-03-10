import { tenants } from 'api/tenants';

import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { buildS3Client } from 'api/infrastructure/S3Client';
import { FileSystemStorage } from './FileSystemStorage';
import { PathManager } from './PathManager';
import { S3FileStorage } from './S3FileStorage';

export class FileStorageFactory {
  static default() {
    const tenant = tenants.current();

    if (tenant.featureFlags?.s3Storage) {
      return FileStorageFactory.s3();
    }

    return FileStorageFactory.disk();
  }

  static s3() {
    return new S3FileStorage(buildS3Client(), new FileContentsIO(), tenants.current());
  }

  static disk() {
    return new FileSystemStorage(new PathManager({ tenant: tenants.current() }));
  }
}
