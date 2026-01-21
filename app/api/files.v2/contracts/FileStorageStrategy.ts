import { Tenant } from '#api/tenants/tenantContext.js';
import { FileStorage, GetFileInput } from '#api/core/application/contracts/FileStorage.js';
import { File } from '../model/File';
import { StoredFile } from '#api/core/domain/files/StoredFile.js';
import { UwaziFile } from '../model/UwaziFile';
import { tenants } from '#api/tenants/index.js';

type Strategy = {
  s3Storage: FileStorage;
  fileSystemStorage: FileStorage;
};

type FileStorageStrategyProps = {
  tenant: Tenant;
  strategy: Strategy;
};

export class FileStorageStrategy implements FileStorage {
  constructor(private props: FileStorageStrategyProps) {}

  private get currentStrategy() {
    if (this.props.tenant.featureFlags?.s3Storage) return this.props.strategy.s3Storage;

    return this.props.strategy.fileSystemStorage;
  }

  async list(): Promise<StoredFile[]> {
    return this.currentStrategy.list();
  }

  getPath(file: UwaziFile): string {
    return this.currentStrategy.getPath(file);
  }

  async getFiles(inputs: GetFileInput[]): Promise<File[]> {
    return this.currentStrategy.getFiles(inputs);
  }

  async getFile(input: GetFileInput): Promise<File> {
    return this.currentStrategy.getFile(input);
  }
}
