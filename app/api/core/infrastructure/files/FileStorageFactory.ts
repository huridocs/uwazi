import { tenants } from '#api/tenants/index.js';

import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { buildS3Client } from '#api/infrastructure/S3Client.js';
import { FileSystemStorage } from './FileSystemStorage.js';
import { PathManager } from './PathManager.js';
import { S3FileStorage } from './S3FileStorage.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';

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

  static forTests() {
    return TestUtils.mockClass<FileStorage>({
      fileExists: jest.fn().mockResolvedValue(true),
      getFile: jest.fn().mockResolvedValue({} as any),
      storeContent: jest.fn().mockResolvedValue(undefined),
      storeFile: jest.fn().mockResolvedValue(undefined),
      removeFile: jest.fn().mockResolvedValue(undefined),
      removeContent: jest.fn().mockResolvedValue(undefined),
      getFiles: jest.fn().mockResolvedValue([]),
      list: jest.fn().mockResolvedValue([]),
      getPath: jest.fn().mockReturnValue(''),
    });
  }
}
