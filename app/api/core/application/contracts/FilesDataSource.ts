import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { BaseFile } from 'api/core/domain/files/BaseFile';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { ResultType } from 'api/core/libs/Result';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ProcessingPDF } from '../../domain/files/ProcessingPDF';
import { FileNotFound, ProcessingFileNotFound } from '../../domain/files/errors';
import { FileType } from '../../domain/files/FileType';
import { ProcessedPDF } from '../../domain/files/ProcessedPDF';
import { Segmentation } from '../../domain/files/Segmentation';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: BaseFile): Promise<void>;
  bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void>;
  update(file: BaseFile): Promise<void>;
  delete(files: BaseFile[]): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<ProcessingPDF, ProcessingFileNotFound>>;
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
  ): ResultSet<ProcessedPDF>;
  getThumbnails(files: ProcessedPDF[]): ResultSet<Thumbnail>;
  getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<BaseFile, FileNotFound>>;
  getById(id: string): Promise<ResultType<BaseFile, FileNotFound>>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
