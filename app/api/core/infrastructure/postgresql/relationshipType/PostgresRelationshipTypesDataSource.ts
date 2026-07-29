import { Db, ObjectId } from 'mongodb';
import { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { ArrayResultSet } from '../common/ArrayResultSet.js';
import {
  PostgresRelationshipTypeMapper,
  RelationshipTypeRow,
} from './PostgresRelationshipTypeMapper.js';

export class PostgresRelationshipTypesDataSource
  extends PostgresDataSource<RelationshipTypeRow>
  implements RelationshipTypesDataSource
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('relationship_types', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      // syncNamespace matches Mongo collection / sync registry for updatelogs compatibility
      sync: { syncDb: deps.mongoDb, syncNamespace: 'relationtypes' },
    });
  }

  async getAll(): Promise<RelationshipType[]> {
    const rows = await this.table.all();
    return rows.map(PostgresRelationshipTypeMapper.toDomain);
  }

  async getById(id: string): Promise<RelationshipType | null> {
    const row = await this.table.where({ _id: id }).first();
    return row ? PostgresRelationshipTypeMapper.toDomain(row) : null;
  }

  async create(input: { name: string }): Promise<RelationshipType> {
    const id = new ObjectId().toHexString();
    await this.table.insert({ _id: id, name: input.name });
    return new RelationshipType(id, input.name);
  }

  async update(input: { id: string; name: string }): Promise<RelationshipType> {
    await this.table.where({ _id: input.id }).update({ name: input.name });
    const updated = await this.getById(input.id);
    if (!updated) {
      throw new Error('Relationship type update failed');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const sql = excludeId
      ? `SELECT 1 FROM relationship_types WHERE lower(btrim(name)) = ? AND _id <> ? LIMIT 1`
      : `SELECT 1 FROM relationship_types WHERE lower(btrim(name)) = ? LIMIT 1`;
    const bindings = excludeId ? [normalized, excludeId] : [normalized];
    const result = await this.table.raw<{ rows: unknown[] }>(sql, bindings);
    return (result.rows?.length ?? 0) > 0;
  }

  async typesExist(ids: string[]): Promise<boolean> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return true;
    }
    const count = await this.table.whereIn('_id', uniqueIds).count();
    return count === uniqueIds.length;
  }

  async getRelationshipTypeIds(): Promise<string[]> {
    const rows = await this.table.select(['_id']).all();
    return rows.map(row => row._id);
  }

  getByIds(ids: string[]): ResultSet<RelationshipType> {
    const uniqueIds = Array.from(new Set(ids));
    return new ArrayResultSet(async () => {
      if (uniqueIds.length === 0) {
        return [];
      }
      const rows = await this.table.whereIn('_id', uniqueIds).all();
      return rows.map(PostgresRelationshipTypeMapper.toDomain);
    });
  }
}
