import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { BaseFile } from 'api/core/domain/files/BaseFile';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { ResultType } from 'api/core/libs/Result';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from '../../domain/files/Document';
import { FileNotFound, ProcessingFileNotFound } from '../../domain/files/errors';
import { FileType } from '../../domain/files/FileType';
import { ProcessedDocument } from '../../domain/files/ProcessedDocument';
import { Segmentation } from '../../domain/files/Segmentation';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: BaseFile): Promise<void>;
  bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void>;
  update(file: BaseFile): Promise<void>;
  delete(files: BaseFile[]): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<Document, ProcessingFileNotFound>>;
  deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]): Promise<void>;
  renameExtractedMetadata(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ): Promise<void>;
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<BaseFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getByEntitiesIds(entitySharedIds: string[]): ResultSet<BaseFile>;
  getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<ProcessedDocument>;
  getThumbnails(files: ProcessedDocument[]): ResultSet<Thumbnail>;
  getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<BaseFile, FileNotFound>>;
  getById(id: string): Promise<ResultType<BaseFile, FileNotFound>>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
