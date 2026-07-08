/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements */
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import type { PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import type { FilesRow } from './PostgresFilesRow.js';
import { FILES_COLUMNS_WITHOUT_FULL_TEXT } from './PostgresFilesDAOColumns.js';
import { Result } from '../../../libs/Result.js';
import type { ResultType } from '../../../libs/Result.js';
import { FileNotFound } from '../../../domain/files/errors.js';
import type {
  GetFileOptions,
  ListFileOptions,
  EntityFileOptions,
} from '../../mongodb/files/FileDAOTypes.js';
import type { LanguageISO6393 } from '#shared/language/languageISO639_3.js';

type Deps = PostgresDataSourceDeps;

class PostgresFilesDAO extends PostgresDataSource {
  protected tableName = 'files';

  protected jsonbColumns = ['toc', 'propertySelections', 'fullText'];

  constructor(deps: Deps) {
    super(deps);
  }

  getTable(): PostgresTable {
    return this.table;
  }

  private resolveColumns<T>(options?: GetFileOptions<T>): string[] {
    if (options?.projection) {
      const projection = options.projection as Record<string, 0 | 1>;
      const entries = Object.entries(projection).filter(([k]) => k !== 'tenant_id');
      const hasInclusions = entries.some(([, v]) => v === 1);

      if (hasInclusions) {
        const columns = entries.filter(([, v]) => v === 1).map(([k]) => k);
        const idExplicitlyExcluded = entries.some(([k, v]) => k === '_id' && v === 0);
        if (!columns.includes('_id') && !idExplicitlyExcluded) {
          columns.unshift('_id');
        }
        return columns;
      }

      const excludes = new Set(entries.filter(([, v]) => v === 0).map(([k]) => k));
      return FILES_COLUMNS_WITHOUT_FULL_TEXT.filter(c => !excludes.has(c));
    }

    if (options?.withFullText) {
      return [...FILES_COLUMNS_WITHOUT_FULL_TEXT, 'fullText'];
    }

    return [...FILES_COLUMNS_WITHOUT_FULL_TEXT];
  }

  async getById<T extends FilesRow = FilesRow>(
    id: string,
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const columns = this.resolveColumns(options);

    const row = await this.table.query<FilesRow>().select(columns).where({ _id: id }).first();

    if (!row) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    return Result.ok(row as T);
  }

  async getByFilename<T extends FilesRow = FilesRow>(
    filename: string,
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const columns = this.resolveColumns(options);

    const row = await this.table.query<FilesRow>().select(columns).where({ filename }).first();

    if (!row) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }

    return Result.ok(row as T);
  }

  async getByEntity<T extends FilesRow = FilesRow>(
    sharedId: string,
    options?: EntityFileOptions<T>
  ): Promise<T[]> {
    const columns = this.resolveColumns(options);

    let query = this.table.query<FilesRow>().select(columns).where({ entity: sharedId });

    if (options?.types) {
      query = query.whereIn('type', options.types);
    }

    if (options?.sort) {
      for (const [field, dir] of Object.entries(options.sort)) {
        query = query.orderBy(field, (dir as number) > 0 ? 'asc' : 'desc');
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return query.all() as Promise<T[]>;
  }

  async getByQuery<T extends FilesRow = FilesRow>(
    query: Record<string, unknown>,
    options?: ListFileOptions<T>
  ): Promise<T[]> {
    const columns = this.resolveColumns(options);

    let qb = this.table.query<FilesRow>().select(columns);

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        if ('$exists' in obj) {
          if (obj.$exists) {
            qb = qb.whereNotNull(key);
          } else {
            qb = qb.whereNull(key);
          }
          continue;
        }
        if ('$in' in obj) {
          qb = qb.whereIn(key, obj.$in as unknown[]);
          continue;
        }
        if ('$nin' in obj) {
          qb = qb.whereNotIn(key, obj.$nin as unknown[]);
          continue;
        }
      }
      qb = qb.where({ [key]: value });
    }

    if (options?.sort) {
      for (const [field, dir] of Object.entries(options.sort)) {
        qb = qb.orderBy(field, (dir as number) > 0 ? 'asc' : 'desc');
      }
    }

    if (options?.limit) {
      qb = qb.limit(options.limit);
    }

    return qb.all() as Promise<T[]>;
  }

  async getNextDocumentWithoutToc<T extends FilesRow = FilesRow>(
    options?: GetFileOptions<T>
  ): Promise<ResultType<T, FileNotFound>> {
    const columns = this.resolveColumns(options);
    const columnList = columns.map(c => `"${c}"`).join(', ');

    // eslint-disable-next-line max-len
    const sql = `SELECT ${columnList} FROM ?? WHERE "type" = 'document' AND "filename" IS NOT NULL AND ("toc" IS NULL OR jsonb_array_length("toc") = 0) AND "tenant_id" = ? ORDER BY "_id" ASC LIMIT 1`;

    const result = await this.table.raw<FilesRow>(sql, [this.table.tableName, this.table.tenantId]);

    const { rows } = result as unknown as { rows: FilesRow[] };

    if (!rows || rows.length === 0) {
      return Result.fail(new FileNotFound('no document without toc found'));
    }

    return Result.ok(rows[0] as T);
  }

  async getByEntitySharedIds<T extends FilesRow = FilesRow>(
    sharedIds: string[],
    options?: EntityFileOptions<T>
  ): Promise<T[]> {
    const columns = this.resolveColumns(options);

    let query = this.table.query<FilesRow>().select(columns).whereIn('entity', sharedIds);

    if (options?.languages) {
      query = query.whereIn('language', options.languages);
    }

    if (options?.types) {
      query = query.whereIn('type', options.types);
    }

    if (options?.sort) {
      for (const [field, dir] of Object.entries(options.sort)) {
        query = query.orderBy(field, (dir as number) > 0 ? 'asc' : 'desc');
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return query.all() as Promise<T[]>;
  }

  async getDistinctEntitySharedIds(filters: {
    type?: string;
    status?: string;
    language?: LanguageISO6393;
  }): Promise<string[]> {
    let query = this.table.query<FilesRow>().distinct(['entity']);

    if (filters.type) query = query.where({ type: filters.type });
    if (filters.status) query = query.where({ status: filters.status });
    if (filters.language) query = query.where({ language: filters.language });

    const rows = await query.all();
    return rows
      .map((r: any) => r.entity as string)
      .filter(entity => entity !== null && entity !== undefined);
  }

  async countDocuments(): Promise<number> {
    return this.table.query().count();
  }

  async getTotalFileSize(): Promise<number> {
    return this.table.query().sum('size');
  }
}

export { PostgresFilesDAO };
