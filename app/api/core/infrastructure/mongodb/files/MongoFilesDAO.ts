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

  async getById(
    id: string,
    options?: { withFullText?: boolean }
  ): Promise<ResultType<fileDBO, FileNotFound>> {
    const projection = options?.withFullText ? undefined : { fullText: 0 };

    return this.getCollection()
      .findOne({ _id: new ObjectId(id) }, { projection })
      .then(dbo => {
        if (!dbo) {
          return Result.fail(new FileNotFound(`file with id: ${id} not found`));
        }
        return Result.ok(dbo);
      });
  }

  async getByFilename(filename: string): Promise<ResultType<fileDBO, FileNotFound>> {
    return this.getCollection()
      .findOne({ filename })
      .then(dbo => {
        if (!dbo) {
          return Result.fail(new FileNotFound(`file: ${filename} not found`));
        }
        return Result.ok(dbo);
      });
  }

  async getByEntity(
    sharedId: string,
    options?: { types?: fileDBO['type'][]; projection?: Document }
  ): Promise<fileDBO[]> {
    const filter: Record<string, unknown> = { entity: sharedId };
    if (options?.types) {
      filter.type = { $in: options.types };
    }
    return this.getCollection().find(filter, { projection: options?.projection }).toArray();
  }

  async getByQuery(
    query: Record<string, unknown>,
    options?: { projection?: Document; sort?: Sort; limit?: number }
  ): Promise<fileDBO[]> {
    const findOptions: FindOptions = {};
    if (options?.projection) findOptions.projection = options.projection;
    if (options?.sort) findOptions.sort = options.sort;
    if (options?.limit) findOptions.limit = options.limit;
    return this.getCollection().find(query, findOptions).toArray();
  }

  async getNextDocumentWithoutToc(): Promise<ResultType<fileDBO, FileNotFound>> {
    return this.getCollection()
      .find(
        { type: 'document', filename: { $exists: true }, 'toc.0': { $exists: false } },
        { projection: { fullText: 0 } }
      )
      .sort({ _id: 1 })
      .limit(1)
      .toArray()
      .then(dbos => {
        if (!dbos.length) {
          return Result.fail(new FileNotFound('no document without toc found'));
        }
        return Result.ok(dbos[0]);
      });
  }

  async getByEntitySharedIds(
    sharedIds: string[],
    options?: { includeFullText?: boolean; languages?: string[]; type?: fileDBO['type'] }
  ): Promise<fileDBO[]> {
    const filter: Record<string, unknown> = { entity: { $in: sharedIds } };
    if (options?.languages) {
      filter.language = { $in: options.languages };
    }
    if (options?.type) {
      filter.type = options.type;
    }
    const projection = options?.includeFullText ? undefined : { fullText: 0 };

    return this.getCollection().find(filter, { projection }).toArray();
  }
}

export { MongoFilesDAO };
