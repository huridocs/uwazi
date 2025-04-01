import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getDocumentsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<Document>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
