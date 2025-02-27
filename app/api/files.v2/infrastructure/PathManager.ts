import path from 'path';
import { Tenant } from 'api/tenants/tenantContext';
import { FileType } from '../model/FileType';

type PathManagerProps = {
  tenant: Tenant;
};

type CreatePathInput = {
  filename: string;
  type: FileType;
};

export class PathManager {
  private directory: Record<FileType, string>;

  constructor(private props: PathManagerProps) {
    this.directory = {
      activitylog: this.props.tenant.activityLogs,
      attachment: this.props.tenant.attachments,
      custom: this.props.tenant.customUploads,
      document: this.props.tenant.uploadedDocuments,
      segmentation: `${this.props.tenant.uploadedDocuments}/segmentation`,
      thumbnail: this.props.tenant.uploadedDocuments,
    };
  }

  createPath(input: CreatePathInput) {
    const directory = this.directory?.[input.type];
    if (!directory) throw new Error(`The following File Type is not supported ${input.type}`);

    return path.join(directory, input.filename);
  }

  get directories() {
    return Object.entries(this.directory).map(([name, value]) => ({
      name: name as FileType,
      value,
    }));
  }
}
