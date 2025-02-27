import { Tenant } from 'api/tenants/tenantContext';
import { FileStorage, GetFileInput } from './FileStorage';
import { File } from '../model/File';
import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';

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
