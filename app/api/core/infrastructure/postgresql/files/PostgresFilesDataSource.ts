/* eslint-disable max-lines */
import { Db } from 'mongodb';
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
import { FILES_COLUMNS_WITHOUT_FULL_TEXT } from './PostgresFilesDAOColumns.js';

type Deps = {
  transactionManager: TransactionManager;
  fileStorage: FileStorage;
  mongoDb: Db;
} & Omit<PostgresDataSourceDeps, 'sync'>;

export class PostgresFilesDataSource extends PostgresDataSource implements FilesDataSource {
  protected tableName = 'files';

  protected jsonbColumns = ['toc', 'propertySelections', 'fullText'];

  private transactionManager: MongoTransactionManager;

  private fileStorage: FileStorage;

  private filesToReindex = new Set<BaseFile>();

  constructor(deps: Deps) {
    super({ ...deps, sync: { syncDb: deps.mongoDb, syncNamespace: 'files' } });

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

  async create(file: BaseFile): Promise<void> {
    await this.table.insert(PostgresFilesMapper.toDBO(file));
    this.setFilesToReindex([file]);
  }

  async bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void> {
    await this.table.insert(files.map(PostgresFilesMapper.toDBO));
    this.setFilesToReindex(files);
  }

  async update(file: BaseFile): Promise<void> {
    const row = this.table.serializeForWrite(PostgresFilesMapper.toDBO(file));
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

  async getById<T extends BaseFile = BaseFile>(id: string): Promise<ResultType<T, FileNotFound>> {
    const row = await this.table
      .query<FilesRow>()
      .select(FILES_COLUMNS_WITHOUT_FULL_TEXT)
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
      .select(FILES_COLUMNS_WITHOUT_FULL_TEXT)
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
      .select(FILES_COLUMNS_WITHOUT_FULL_TEXT)
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

  async filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean> {
    if (!files.length) return true;
    const count = await this.table
      .query()
      .whereAny(files.map(f => ({ _id: f._id, entity: f.entity })))
      .count();
    return count === files.length;
  }

  async getAll(): Promise<BaseFile[]> {
    const rows = await this.table.query<FilesRow>().select(FILES_COLUMNS_WITHOUT_FULL_TEXT).all();
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
      .select(FILES_COLUMNS_WITHOUT_FULL_TEXT)
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

  async deletePropertySelections(
    entityPropertyNames: string[],
    entitySharedIds: string[]
  ): Promise<void> {
    if (!entityPropertyNames.length || !entitySharedIds.length) return;

    const propPlaceholders = entityPropertyNames.map(() => '?').join(', ');
    const entityPlaceholders = entitySharedIds.map(() => '?').join(', ');

    const bindings: unknown[] = [this.table.tableName];
    entityPropertyNames.forEach(name => bindings.push(name));
    entitySharedIds.forEach(id => bindings.push(id));
    bindings.push(this.table.tenantId);

    await this.table.raw(
      // eslint-disable-next-line max-len
      `UPDATE ?? SET "propertySelections" = (SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) FROM jsonb_array_elements("propertySelections") elem WHERE NOT (elem->>'name' IN (${propPlaceholders}))) WHERE "entity" IN (${entityPlaceholders}) AND "tenant_id" = ? AND jsonb_array_length("propertySelections") > 0`,
      bindings
    );
  }

  async renamePropertySelections(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ): Promise<void> {
    const entries = Object.entries(renamedPropertyNames);
    if (!entries.length || !entitySharedIds.length) return;

    const cases: string[] = [];
    const bindings: unknown[] = [this.table.tableName];
    entries.forEach(([oldName, newName]) => {
      cases.push("WHEN elem->>'name' = ? THEN jsonb_set(elem, '{name}', to_jsonb(?::text))");
      bindings.push(oldName, newName);
    });
    const entityPlaceholders = entitySharedIds.map(() => '?').join(', ');
    entitySharedIds.forEach(id => bindings.push(id));
    bindings.push(this.table.tenantId);

    await this.table.raw(
      `UPDATE ?? SET "propertySelections" = (SELECT COALESCE(jsonb_agg(CASE ${cases.join(' ')} ELSE elem END), '[]'::jsonb) FROM jsonb_array_elements("propertySelections") elem) WHERE "entity" IN (${entityPlaceholders}) AND "tenant_id" = ? AND jsonb_array_length("propertySelections") > 0`,
      bindings
    );
  }
}
