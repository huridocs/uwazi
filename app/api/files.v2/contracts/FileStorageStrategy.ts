import { Tenant } from 'api/tenants/tenantContext';
import { FileContents } from '../model/FileContents';
import { StoredFile } from '../model/StoredFile';
import { UwaziFile } from '../model/UwaziFile';
import { FileStorage, GetFileInput, UploadFileInput } from './FileStorage';

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

  async storeFile(input: UploadFileInput) {
    return this.currentStrategy.storeFile(input);
  }

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

  async getFiles(inputs: GetFileInput[]): Promise<FileContents[]> {
    return this.currentStrategy.getFiles(inputs);
  }

  async getFile(input: GetFileInput): Promise<FileContents> {
    return this.currentStrategy.getFile(input);
  }
}
