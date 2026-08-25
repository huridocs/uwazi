/* eslint-disable max-lines */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements */
import type { Knex } from 'knex';
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

const PG_ARRAY_CAST: Record<string, string> = {
  string: 'text',
  number: 'numeric',
  boolean: 'boolean',
};

/**
 * Picks the Postgres array element type for an `$in` / `$nin` operand, or `null` when the caller
 * must fall back to `whereIn` / `whereNotIn`.
 *
 * The cast has to follow the values because `getByQuery` applies these operators to *any* column:
 * a blanket `::text[]` would break on `totalPages`, `size` or `creationDate`.
 *
 * `numeric` is deliberate over `integer` — it compares correctly against `INTEGER` and `BIGINT`
 * columns through an implicit cast, and it will not truncate a float.
 *
 * Returns `null` for an empty array, for mixed types, and for anything outside the allowlist
 * (`null`, `undefined`, objects, symbols, bigints, functions). `typeof` returns a closed set of
 * strings, none of which collide with `Object.prototype` keys, so the plain-object lookup is safe.
 */
function arrayCastFor(values: unknown[]): string | null {
  if (!values.length) {
    return null;
  }

  const cast = PG_ARRAY_CAST[typeof values[0]];

  if (!cast) {
    return null;
  }

  return values.every(value => typeof value === typeof values[0]) ? cast : null;
}

/**
 * Applies an `$in` / `$nin` operand as a **single** bind parameter: `= ANY(array)` sends one
 * parameter regardless of length, where `whereIn` / `whereNotIn` send one per element. The
 * Postgres wire protocol counts parameters in an Int16, so a ~65k-element exclusion list
 * overflows it and the connection dies with `bind message has N parameter formats`.
 *
 * The cast is interpolated into the SQL string rather than bound — `?::?` is not valid SQL. It
 * comes from the fixed `PG_ARRAY_CAST` allowlist in `arrayCastFor`, never from caller input.
 *
 * `null` / `undefined` are stripped before binding: `NOT (x = ANY(arr))` evaluates to NULL when
 * `arr` contains a NULL, which silently drops every row.
 *
 * When no cast applies the original, unstripped array goes to `whereIn` / `whereNotIn`, so those
 * cases behave exactly as they did before — including `$in: []` matching nothing and `$nin: []`
 * matching everything.
 */
function applyArrayOperator(
  qb: PostgresTable<FilesRow>,
  key: string,
  values: Knex.Value[],
  negated: boolean
): PostgresTable<FilesRow> {
  const bindable = values.filter(value => value !== null && value !== undefined);
  const cast = arrayCastFor(bindable);

  if (!cast) {
    return negated ? qb.whereNotIn(key, values) : qb.whereIn(key, values);
  }

  const condition = negated ? `NOT (?? = ANY(?::${cast}[]))` : `?? = ANY(?::${cast}[])`;

  return qb.whereRaw(condition, [key, bindable] as unknown as Knex.RawBinding[]);
}

class PostgresFilesDAO extends PostgresDataSource<FilesRow> {
  constructor(deps: Deps) {
    super('files', deps);
  }

  getTable(): PostgresTable<FilesRow> {
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

    const row = await this.table.select(columns).where({ _id: id }).first();

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

    const row = await this.table.select(columns).where({ filename }).first();

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

    let query = this.table.select(columns).where({ entity: sharedId });

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

    let qb = this.table.select(columns);

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
          qb = applyArrayOperator(qb, key, obj.$in as Knex.Value[], false);
          continue;
        }
        if ('$nin' in obj) {
          qb = applyArrayOperator(qb, key, obj.$nin as Knex.Value[], true);
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
    const sql = `SELECT ${columnList} FROM ?? WHERE "type" = 'document' AND "filename" IS NOT NULL AND "entity" IS NOT NULL AND "entity" <> '' AND ("toc" IS NULL OR jsonb_array_length("toc") = 0) AND "tenant_id" = ? ORDER BY "_id" ASC LIMIT 1`;

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

    let query = this.table.select(columns).whereIn('entity', sharedIds);

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
    let query = this.table.distinct(['entity']);

    if (filters.type) query = query.where({ type: filters.type });
    if (filters.status) query = query.where({ status: filters.status });
    if (filters.language) query = query.where({ language: filters.language });

    const rows = await query.all();
    return rows
      .map((r: any) => r.entity as string)
      .filter(entity => entity !== null && entity !== undefined);
  }

  async countDocuments(): Promise<number> {
    return this.table.count();
  }

  async getTotalFileSize(): Promise<number> {
    return this.table.sum('size');
  }
}

export { PostgresFilesDAO, arrayCastFor };
