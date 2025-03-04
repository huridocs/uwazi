import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';

interface FilesDataSource {
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getDocumentsForEntity(entitySharedId: string): ResultSet<Document>;
}
export type { FilesDataSource };
