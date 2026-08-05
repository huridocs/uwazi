import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { ResultType } from '#api/core/libs/Result.js';
import { PDFDocument } from '../../domain/files/PDFDocument.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { FileNotFound, ProcessingFileNotFound } from '../../domain/files/errors.js';
import { FileType } from '../../domain/files/FileType.js';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  create(file: BaseFile): Promise<void>;
  bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void>;
  update(file: BaseFile): Promise<void>;
  bulkUpdate(files: BaseFile[]): Promise<void>;
  replaceFile(file: BaseFile): Promise<void>;
  delete(files: BaseFile[]): Promise<void>;
  getProcessingById(documentId: string): Promise<ResultType<PDFDocument, ProcessingFileNotFound>>;
  deletePropertySelections(entityPropertyNames: string[], entitySharedIds: string[]): Promise<void>;
  renamePropertySelections(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ): Promise<void>;
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): Promise<BaseFile[]>;
  getByEntitiesIds(entitySharedIds: string[]): Promise<BaseFile[]>;
  getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): Promise<PDFDocument[]>;
  getThumbnails(entitySharedIds: string[]): Promise<Thumbnail[]>;
  getThumbnailsByLanguage(language: LanguageISO6391): Promise<Thumbnail[]>;
  getThumbnailsForProcessedPDFs(documentIds: string[]): Promise<Thumbnail[]>;
  getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<BaseFile, FileNotFound>>;
  getById<T extends BaseFile = BaseFile>(id: string): Promise<ResultType<T, FileNotFound>>;
  getByIds(ids: string[]): Promise<BaseFile[]>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
