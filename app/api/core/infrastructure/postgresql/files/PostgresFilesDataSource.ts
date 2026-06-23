/* eslint-disable max-lines */
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { FileStorage } from '../../../application/contracts/FileStorage.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { FilesDataSource } from '../../../application/contracts/FilesDataSource.js';
import type { GetDocumentsForEntityOptions } from '../../../application/contracts/FilesDataSource.js';
import { BaseFile, FileContentLoader } from '../../../domain/files/BaseFile.js';
import { PDFDocument } from '../../../domain/files/PDFDocument.js';
import { Thumbnail } from '../../../domain/files/Thumbnail.js';
import { FileType } from '../../../domain/files/FileType.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { Result, ResultType } from '../../../libs/Result.js';
import { FileNotFound, ProcessingFileNotFound } from '../../../domain/files/errors.js';
import { search } from '#api/search/index.js';
import { PostgresFilesMapper } from './PostgresFilesMapper.js';
import type { FilesRow } from './PostgresFilesRow.js';

type Deps = {
  transactionManager: TransactionManager;
  fileStorage: FileStorage;
} & PostgresDataSourceDeps;

export class PostgresFilesDataSource extends PostgresDataSource implements FilesDataSource {
  protected tableName = 'files';

  private static readonly COLUMNS_WITHOUT_FULL_TEXT = [
    '_id',
    'tenant_id',
    'originalname',
    'filename',
    'mimetype',
    'size',
    'creationDate',
    'type',
    'entity',
    'status',
    'totalPages',
    'language',
    'generatedToc',
    'url',
    'toc',
    'propertySelections',
  ];

  private transactionManager: MongoTransactionManager;

  private fileStorage: FileStorage;

  private filesToReindex = new Set<BaseFile>();

  constructor(deps: Deps) {
    super(deps);

    this.transactionManager = deps.transactionManager as MongoTransactionManager;
    this.fileStorage = deps.fileStorage;

    this.transactionManager.onCommitted(async () => {
      const files = Array.from(this.filesToReindex);
      if (!files.length) return;

      await search.indexEntities(
        { sharedId: { $in: files.filter(f => f.isEntityFile()).map(f => f.entity) } },
        files.some(f => f instanceof PDFDocument && f.isReady()) ? '+fullText' : undefined
      );
      this.filesToReindex = new Set<BaseFile>();
    });
  }

  private contentLoader: FileContentLoader = opts => this.fileStorage.getFile(opts);

  private toDomain(row: FilesRow): BaseFile {
    return PostgresFilesMapper.toDomain(row, this.contentLoader);
  }

  private setFilesToReindex(files: BaseFile[]) {
    files.forEach(file => {
      if (file.isEntityFile()) this.filesToReindex.add(file);
    });
  }

  // ---- Write methods ----

  async create(file: BaseFile): Promise<void> {
    await this.table.insert(PostgresFilesMapper.toDBO(file));
    this.setFilesToReindex([file]);
  }

  async bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void> {
    await this.table.insert(files.map(PostgresFilesMapper.toDBO));
    this.setFilesToReindex(files);
  }

  async update(file: BaseFile): Promise<void> {
    const row = PostgresFilesMapper.toDBO(file);
    await this.table.query().where({ _id: file.id }).update(row);
    this.setFilesToReindex([file]);
  }

  async bulkUpdate(files: BaseFile[]): Promise<void> {
    if (!files.length) return;
    await this.table.upsert(files.map(PostgresFilesMapper.toDBO));
    this.setFilesToReindex(files);
  }

  async replaceFile(file: BaseFile): Promise<void> {
    await this.table.upsert(PostgresFilesMapper.toDBO(file));
    this.setFilesToReindex([file]);
  }

  async delete(files: BaseFile[]): Promise<void> {
    await this.table
      .query()
      .whereIn(
        '_id',
        files.map(f => f.id)
      )
      .delete();
    this.setFilesToReindex(files);
  }

  // ---- Single-result query methods ----

  async getById<T extends BaseFile = BaseFile>(id: string): Promise<ResultType<T, FileNotFound>> {
    const row = await this.table
      .query<FilesRow>()
      .select(PostgresFilesDataSource.COLUMNS_WITHOUT_FULL_TEXT)
      .where({ _id: id })
      .first();
    if (!row) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }
    return Result.ok(this.toDomain(row) as unknown as T);
  }

  async getByIds(ids: string[]): Promise<BaseFile[]> {
    const rows = await this.table
      .query<FilesRow>()
      .select(PostgresFilesDataSource.COLUMNS_WITHOUT_FULL_TEXT)
      .whereIn('_id', ids)
      .all();
    return rows.map(row => this.toDomain(row));
  }

  async getByFilename(
    filename: string,
    allowedTypes?: FileType[]
  ): Promise<ResultType<BaseFile, FileNotFound>> {
    let query = this.table
      .query<FilesRow>()
      .select(PostgresFilesDataSource.COLUMNS_WITHOUT_FULL_TEXT)
      .where({ filename });
    if (allowedTypes) {
      query = query.whereIn('type', allowedTypes);
    }
    const row = await query.first();
    if (!row) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }
    return Result.ok(this.toDomain(row));
  }

  async getProcessingById(
    fileId: string
  ): Promise<ResultType<PDFDocument, ProcessingFileNotFound>> {
    const row = await this.table
      .query<FilesRow>()
      .where({ _id: fileId, status: 'processing' })
      .first();
    if (!row) {
      return Result.fail(new ProcessingFileNotFound(fileId));
    }
    return Result.ok(this.toDomain(row) as PDFDocument);
  }

  // ---- Collection query methods ----

  async filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean> {
    if (!files.length) return true;
    for (const file of files) {
      const count = await this.table
        .query<FilesRow>()
        .where({ _id: file._id, entity: file.entity })
        .count();
      if (count === 0) return false;
    }
    return true;
  }

  async getAll(): Promise<BaseFile[]> {
    const rows = await this.table
      .query<FilesRow>()
      .select(PostgresFilesDataSource.COLUMNS_WITHOUT_FULL_TEXT)
      .all();
    return rows.map(row => this.toDomain(row));
  }

  async getByEntitiesIds(entitySharedIds: string[]): Promise<BaseFile[]> {
    const rows = await this.table
      .query<FilesRow>()
      .whereIn('entity', entitySharedIds)
      .whereNot('type', 'thumbnail')
      .all();
    return rows.map(row => this.toDomain(row));
  }

  async getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): Promise<PDFDocument[]> {
    let query = this.table
      .query<FilesRow>()
      .select(PostgresFilesDataSource.COLUMNS_WITHOUT_FULL_TEXT)
      .where({ entity: entitySharedId, type: 'document', status: 'ready' });

    if (options?.languages) {
      const iso6393 = options.languages
        .map(l => LanguageUtils.fromISO639_1(l)?.ISO639_3)
        .filter(Boolean) as string[];
      if (iso6393.length) {
        query = query.whereIn('language', iso6393);
      }
    }

    const rows = await query.all();
    return rows.map(row => this.toDomain(row) as PDFDocument);
  }

  async getThumbnails(entitySharedIds: string[]): Promise<Thumbnail[]> {
    const rows = await this.table
      .query<FilesRow>()
      .whereIn('entity', entitySharedIds)
      .where({ type: 'thumbnail' })
      .all();
    return rows.map(row => this.toDomain(row) as Thumbnail);
  }

  async getThumbnailsByLanguage(language: LanguageISO6391): Promise<Thumbnail[]> {
    const iso6393 = LanguageUtils.fromISO639_1(language).ISO639_3;
    const rows = await this.table
      .query<FilesRow>()
      .where({ type: 'thumbnail', language: iso6393 })
      .all();
    return rows.map(row => this.toDomain(row) as Thumbnail);
  }

  async getThumbnailsForProcessedPDFs(documentIds: string[]): Promise<Thumbnail[]> {
    const filenames = documentIds.map(id => `${id}.jpg`);
    const rows = await this.table
      .query<FilesRow>()
      .whereIn('filename', filenames)
      .where({ type: 'thumbnail' })
      .all();
    return rows.map(row => this.toDomain(row) as Thumbnail);
  }

  // ---- Deferred methods ----

  async deletePropertySelections(
    _entityPropertyNames: string[],
    _entitySharedIds: string[]
  ): Promise<void> {
    throw new Error('Not implemented');
  }

  async renamePropertySelections(
    _renamedPropertyNames: { [previousName: string]: string },
    _entitySharedIds: string[]
  ): Promise<void> {
    throw new Error('Not implemented');
  }
}
