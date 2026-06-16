import { Db, Document, FindOptions, ObjectId, Sort } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { fileDBO } from './schemas/filesTypes.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

class MongoFilesDAO extends MongoDataSource<fileDBO> {
  protected collectionName = 'files';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getById<T extends fileDBO = fileDBO>(
    id: string,
    options?: { withFullText?: boolean }
  ): Promise<ResultType<T, FileNotFound>> {
    const projection = options?.withFullText ? undefined : { fullText: 0 };

    const dbo = await this.getCollection().findOne({ _id: new ObjectId(id) }, { projection });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    return Result.ok(dbo as T);
  }

  async getByFilename<T extends fileDBO = fileDBO>(
    filename: string
  ): Promise<ResultType<T, FileNotFound>> {
    const dbo = await this.getCollection().findOne({ filename });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }

    return Result.ok(dbo as T);
  }

  async getByEntity<T extends fileDBO = fileDBO>(
    sharedId: string,
    options?: { types?: fileDBO['type'][]; projection?: Document }
  ): Promise<T[]> {
    const filter: Record<string, unknown> = { entity: sharedId };
    if (options?.types) {
      filter.type = { $in: options.types };
    }

    return this.getCollection()
      .find(filter, { projection: options?.projection })
      .toArray() as Promise<T[]>;
  }

  async getByQuery<T = fileDBO>(
    query: Record<string, unknown>,
    options?: { projection?: Document; sort?: Sort; limit?: number }
  ): Promise<T[]> {
    const findOptions: FindOptions = {};
    if (options?.projection) findOptions.projection = options.projection;
    if (options?.sort) findOptions.sort = options.sort;
    if (options?.limit) findOptions.limit = options.limit;

    return this.getCollection().find(query, findOptions).toArray() as Promise<T[]>;
  }

  async getNextDocumentWithoutToc<T extends fileDBO = fileDBO>(): Promise<
    ResultType<T, FileNotFound>
  > {
    const dbos = await this.getCollection()
      .find(
        { type: 'document', filename: { $exists: true }, 'toc.0': { $exists: false } },
        { projection: { fullText: 0 } }
      )
      .sort({ _id: 1 })
      .limit(1)
      .toArray();

    if (!dbos.length) {
      return Result.fail(new FileNotFound('no document without toc found'));
    }

    return Result.ok(dbos[0] as T);
  }

  async getByEntitySharedIds<T extends fileDBO = fileDBO>(
    sharedIds: string[],
    options?: { includeFullText?: boolean; languages?: string[]; type?: fileDBO['type'] }
  ): Promise<T[]> {
    const filter: Record<string, unknown> = { entity: { $in: sharedIds } };
    if (options?.languages) {
      filter.language = { $in: options.languages };
    }

    if (options?.type) {
      filter.type = options.type;
    }

    const projection = options?.includeFullText ? undefined : { fullText: 0 };

    return this.getCollection().find(filter, { projection }).toArray() as Promise<T[]>;
  }
}

export { MongoFilesDAO };
