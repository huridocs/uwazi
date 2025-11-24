import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { ResultType } from 'api/core/libs/Result';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from '../../domain/files/Document';
import { Segmentation } from '../../domain/files/Segmentation';
import { UwaziFile } from '../../domain/files/UwaziFile';
import { ProcessedDocument } from '../../domain/files/ProcessedDocument';
import { FileNotFound, ProcessingFileNotFound } from '../../domain/files/errors';
import { FileType } from '../../domain/files/FileType';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: UwaziFile): Promise<void>;
  bulkCreate(files: [UwaziFile, ...UwaziFile[]]): Promise<void>;
  update(file: UwaziFile): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<Document, ProcessingFileNotFound>>;
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
  getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<UwaziFile, FileNotFound>>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
