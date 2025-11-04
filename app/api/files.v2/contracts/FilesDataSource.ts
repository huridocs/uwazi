import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from '../model/Document';
import { Segmentation } from '../model/Segmentation';
import { UwaziFile } from '../model/UwaziFile';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: UwaziFile): Promise<void>;
  deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]): Promise<void>;
  renameExtractedMetadata(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ): Promise<void>;
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getDocumentsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<Document>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
