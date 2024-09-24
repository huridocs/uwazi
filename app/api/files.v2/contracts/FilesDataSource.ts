import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { UwaziFile } from '../model/UwaziFile';

export interface FilesDataSource {
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
}
