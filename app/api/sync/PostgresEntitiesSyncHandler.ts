import { Db } from 'mongodb';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresPermissionEnforcedTable } from '#api/core/infrastructure/postgresql/common/PostgresPermissionEnforcedTable.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { SyncLogWriter } from '#api/core/infrastructure/postgresql/common/SyncLogWriter.js';
import { EntityRow } from '#api/core/infrastructure/postgresql/entity/PostgresEntityRow.js';
import { SyncHandler } from './SyncHandler.js';

type EntitySyncRow = Omit<EntityRow, 'permissions'> & {
  permissions?: EntityRow['permissions'];
};

type SyncEntityDocument = Partial<
  Omit<EntityRow, '_id' | 'template' | 'user' | 'icon' | 'metadata' | 'permissions'>
> & {
  _id?: string | { toString(): string };
  template?: string | { toString(): string };
  user?: string | { toString(): string } | null;
  icon?: EntityRow['icon'];
  metadata?: EntityRow['metadata'];
  permissions?: EntityRow['permissions'];
};

const toString = (value: string | { toString(): string } | undefined | null): string | null => {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : value.toString();
};

const toRow = (document: SyncEntityDocument): Record<string, unknown> => ({
  _id: toString(document._id) as string,
  sharedId: document.sharedId as string,
  language: document.language as string,
  title: document.title as string,
  template: toString(document.template) as string,
  published: document.published as boolean,
  generatedToc: document.generatedToc ?? null,
  icon: JSON.stringify(document.icon ?? {}),
  creationDate: document.creationDate as number,
  editDate: document.editDate as number,
  metadata: JSON.stringify(document.metadata ?? {}),
  user: toString(document.user),
  permissions: JSON.stringify(document.permissions ?? []),
  preview: document.preview ?? null,
});

export class PostgresEntitiesSyncHandler
  extends PostgresDataSource<EntityRow>
  implements SyncHandler<EntitySyncRow>
{
  private readonly entitiesTable: PostgresPermissionEnforcedTable<EntityRow>;

  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
    accessContext: AccessContext;
  }) {
    super('entities', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'entities' },
    });
    this.entitiesTable = PostgresPermissionEnforcedTable.for<EntityRow>({
      tableName: 'entities',
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
      accessContext: deps.accessContext,
      syncWriter: new SyncLogWriter(deps.mongoDb, 'entities'),
    });
  }

  protected override get table(): PostgresTable<EntityRow> {
    return this.entitiesTable;
  }

  async getById(id: string): Promise<EntitySyncRow | null> {
    const row = await this.table.where({ _id: id }).first();
    return row || null;
  }

  async save(document: SyncEntityDocument): Promise<EntitySyncRow> {
    const id = toString(document._id);
    if (!id) throw new Error('PostgresEntitiesSyncHandler: document._id is required');

    await this.table.upsert(toRow(document));

    return { ...document, _id: id } as unknown as EntitySyncRow;
  }

  async saveMultiple(documents: SyncEntityDocument[]): Promise<EntitySyncRow[]> {
    if (documents.length === 0) return [];

    const validated = documents.map(doc => {
      const id = toString(doc._id);
      if (!id) throw new Error('PostgresEntitiesSyncHandler: document._id is required');
      return { doc, id };
    });

    await this.table.upsert(validated.map(({ doc }) => toRow(doc)));

    return validated.map(({ doc, id }) => ({ ...doc, _id: id }) as unknown as EntitySyncRow);
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}
