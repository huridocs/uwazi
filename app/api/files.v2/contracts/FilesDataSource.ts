import { LanguageISO6391 } from '#shared/types/commonTypes.js';

import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '#api/core/domain/files/Segmentation.js';
import { Document } from '#api/files.v2/model/Document.js';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
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
