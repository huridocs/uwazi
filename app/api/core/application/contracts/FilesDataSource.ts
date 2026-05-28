import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { ResultType } from '#api/core/libs/Result.js';
import { PropertySelectionSchema, LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ProcessingPDF } from '../../domain/files/ProcessingPDF.js';
import { FileNotFound, ProcessingFileNotFound } from '../../domain/files/errors.js';
import { FileType } from '../../domain/files/FileType.js';
import { ProcessedPDF } from '../../domain/files/ProcessedPDF.js';
import { Segmentation } from '../../domain/files/Segmentation.js';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: BaseFile): Promise<void>;
  bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void>;
  update(file: BaseFile): Promise<void>;
  bulkUpdate(files: BaseFile[]): Promise<void>;
  delete(files: BaseFile[]): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<ProcessingPDF, ProcessingFileNotFound>>;
  savePropertySelections(
    fileId: string,
    propertySelections: PropertySelectionSchema[]
  ): Promise<void>;
  deletePropertySelections(entityPropertyNames: string[], entitySharedIds: string[]): Promise<void>;
  renamePropertySelections(
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
  getThumbnails(entitySharedIds: string[]): ResultSet<Thumbnail>;
  getThumbnailsByLanguage(language: LanguageISO6391): ResultSet<Thumbnail>;
  getThumbnailsForProcessedPDFs(documentIds: string[]): ResultSet<Thumbnail>;
  getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<BaseFile, FileNotFound>>;
  getById(id: string): Promise<ResultType<BaseFile, FileNotFound>>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
