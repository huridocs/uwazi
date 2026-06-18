import { Db, Document, FindOptions, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { FileDBO } from './schemas/filesTypes.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import type { GetFileOptions, ListFileOptions, EntityFileOptions } from './queryOptions.js';

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

    return this.getCollection().find(query, findOptions).toArray() as Promise<T[]>;
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
}

export { MongoFilesDAO };
