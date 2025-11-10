import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { ResultType } from 'api/core/libs/Result';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from '../model/Document';
import { Segmentation } from '../model/Segmentation';
import { UwaziFile } from '../model/UwaziFile';
import { ProcessedDocument } from '../model/ProcessedDocument';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: UwaziFile): Promise<void>;
  update(file: UwaziFile): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<Document, Error>>;
  deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]): Promise<void>;
  renameExtractedMetadata(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ): Promise<void>;
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<ProcessedDocument>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
