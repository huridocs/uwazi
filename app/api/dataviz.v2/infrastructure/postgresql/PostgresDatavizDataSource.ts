import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizDuplicateNameError, DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import { DatavizRow } from './DatavizRow.js';
import { PostgresDatavizMapper } from './PostgresDatavizMapper.js';

const UNIQUE_VIOLATION = '23505';

/**
 * The unique name constraint is the last word on a taken name: two writes can both pass the
 * use case's existsByName check before either lands.
 */
const asDuplicateName = (error: unknown, dataviz: Dataviz): unknown => {
  const { code } = (error ?? {}) as { code?: string };
  return code === UNIQUE_VIOLATION ? new DatavizDuplicateNameError(dataviz.name) : error;
};

/** A replace must clear optional columns the new version no longer carries. */
const withNulls = (row: DatavizRow): Record<string, unknown> =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? null]));

class PostgresDatavizDataSource
  extends PostgresDataSource<DatavizRow>
  implements DatavizDataSource
{
  constructor(deps: PostgresDataSourceDeps) {
    super('dataviz', deps);
  }

  async create(dataviz: Dataviz): Promise<void> {
    try {
      await this.table.insert(PostgresDatavizMapper.toRow(dataviz));
    } catch (error) {
      throw asDuplicateName(error, dataviz);
    }
  }

  async update(dataviz: Dataviz): Promise<void> {
    const { _id, ...changes } = withNulls(PostgresDatavizMapper.toRow(dataviz));
    try {
      await this.table.where({ _id }).update(changes);
    } catch (error) {
      throw asDuplicateName(error, dataviz);
    }
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }

  async getById(id: string) {
    const row = await this.table.where({ _id: id }).first();
    if (!row) {
      return Result.fail(new DatavizNotFoundError(id));
    }
    return Result.ok(PostgresDatavizMapper.toDomain(row));
  }

  async list(): Promise<Dataviz[]> {
    const rows = await this.table.orderBy('name').all();
    return rows.map(PostgresDatavizMapper.toDomain);
  }

  async existsByName(name: string): Promise<boolean> {
    const row = await this.table.where({ name }).first();
    return Boolean(row);
  }

  async setProcessing(id: string, processing: Dataviz['processing']): Promise<void> {
    await this.table
      .where({ _id: id })
      .update({ processing: processing ?? null, updatedAt: new Date() });
  }
}

export { PostgresDatavizDataSource };
