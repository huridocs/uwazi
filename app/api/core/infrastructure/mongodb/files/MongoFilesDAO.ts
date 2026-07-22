import { Db, Document, FindOptions, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { FileDBO } from './schemas/FilesTypes.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import type { GetFileOptions, ListFileOptions, EntityFileOptions } from './FileDAOTypes.js';
import type { LanguageISO6393 } from '#shared/language/languageISO639_3.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const defaultProjection: Document = { fullText: 0 };

function resolveProjection(options?: GetFileOptions): Document | undefined {
  if (options?.projection) return options.projection;
  if (options?.withFullText) return {};
  return defaultProjection;
}

class MongoFilesDAO extends MongoDataSource<FileDBO> {
  protected collectionName = 'files';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getById<T extends FileDBO = FileDBO>(
    id: string,
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const projection = resolveProjection(options);

    const dbo = await this.getCollection().findOne({ _id: new ObjectId(id) }, { projection });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    return Result.ok(dbo as T);
  }

  async getByFilename<T extends FileDBO = FileDBO>(
    filename: string,
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const projection = resolveProjection(options);

    const dbo = await this.getCollection().findOne({ filename }, { projection });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }

    return Result.ok(dbo as T);
  }

  async getByEntity<T extends FileDBO = FileDBO>(
    sharedId: string,
    options?: EntityFileOptions<T>
  ): Promise<T[]> {
    const filter: Record<string, unknown> = { entity: sharedId };
    if (options?.types) {
      filter.type = { $in: options.types };
    }

    const findOptions: FindOptions = {};
    findOptions.projection = resolveProjection(options);
    if (options?.sort) findOptions.sort = options.sort;
    if (options?.limit) findOptions.limit = options.limit;

    return this.getCollection().find(filter, findOptions).toArray() as Promise<T[]>;
  }

  async getByQuery<T extends FileDBO = FileDBO>(
    query: Record<string, unknown>,
    options?: ListFileOptions<T>
  ): Promise<T[]> {
    const findOptions: FindOptions = {};
    findOptions.projection = resolveProjection(options);
    if (options?.sort) findOptions.sort = options.sort;
    if (options?.limit) findOptions.limit = options.limit;

    const resolvedQuery = { ...query };
    if (typeof resolvedQuery._id === 'string' && ObjectId.isValid(resolvedQuery._id)) {
      resolvedQuery._id = new ObjectId(resolvedQuery._id);
    }

    return this.getCollection().find(resolvedQuery, findOptions).toArray() as Promise<T[]>;
  }

  async getNextDocumentWithoutToc<T extends FileDBO = FileDBO>(
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const projection = resolveProjection(options);
    const dbos = await this.getCollection()
      .find(
        { type: 'document', filename: { $exists: true }, 'toc.0': { $exists: false } },
        { projection }
      )
      .sort({ _id: 1 })
      .limit(1)
      .toArray();

    if (!dbos.length) {
      return Result.fail(new FileNotFound('no document without toc found'));
    }

    return Result.ok(dbos[0] as T);
  }

  async getByEntitySharedIds<T extends FileDBO = FileDBO>(
    sharedIds: string[],
    options?: EntityFileOptions<T>
  ): Promise<T[]> {
    const filter: Record<string, unknown> = { entity: { $in: sharedIds } };
    if (options?.languages) {
      filter.language = { $in: options.languages };
    }

    if (options?.types) {
      filter.type = { $in: options.types };
    }

    const findOptions: FindOptions = {};
    findOptions.projection = resolveProjection(options);
    if (options?.sort) findOptions.sort = options.sort;
    if (options?.limit) findOptions.limit = options.limit;

    return this.getCollection().find(filter, findOptions).toArray() as Promise<T[]>;
  }

  async getDistinctEntitySharedIds(filters: {
    type?: string;
    status?: string;
    language?: LanguageISO6393;
  }): Promise<string[]> {
    const query: Record<string, unknown> = {};
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.language) query.language = filters.language;

    const values = await this.getCollection().distinct('entity', query);
    return values.filter((v): v is string => v !== null && v !== undefined);
  }

  async countDocuments(): Promise<number> {
    return this.getCollection().countDocuments();
  }

  async getTotalFileSize(): Promise<number> {
    const [result] = await this.getCollection()
      .aggregate<{ totalSize: number }>([{ $group: { _id: null, totalSize: { $sum: '$size' } } }])
      .toArray();
    return result?.totalSize ?? 0;
  }
}

export { MongoFilesDAO };
