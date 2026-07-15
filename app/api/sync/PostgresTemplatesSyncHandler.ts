import { Db } from 'mongodb';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { TemplateRow } from '#api/core/infrastructure/postgresql/template/PostgresTemplateMapper.js';
import { SyncHandler } from './SyncHandler.js';

type TemplateSyncRow = Omit<TemplateRow, 'processing'> & { processing?: Record<string, unknown> };

export class PostgresTemplatesSyncHandler
  extends PostgresDataSource<TemplateRow>
  implements SyncHandler<TemplateSyncRow>
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('templates', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'templates' },
    });
  }

  async getById(id: string): Promise<TemplateSyncRow | null> {
    const row = await this.table.where({ _id: id }).first();
    return row || null;
  }

  async save(document: Partial<TemplateSyncRow>): Promise<TemplateSyncRow> {
    const { _id: rawId, ...rest } = document as TemplateSyncRow;
    if (!rawId) throw new Error('PostgresTemplatesSyncHandler: document._id is required');
    const id = rawId.toString();

    await this.unsetOtherDefault(document);

    await this.table.upsert({
      _id: id,
      ...rest,
      properties: JSON.stringify(rest.properties ?? []),
      commonProperties: JSON.stringify(rest.commonProperties ?? []),
      processing: rest.processing ? JSON.stringify(rest.processing) : null,
    } as Record<string, unknown>);

    const row = await this.table.where({ _id: id }).first();
    return row!;
  }

  async saveMultiple(documents: Partial<TemplateSyncRow>[]): Promise<TemplateSyncRow[]> {
    if (documents.length === 0) return [];

    const syncedDefault = documents.find(template => template.default);
    if (syncedDefault) {
      await this.unsetOtherDefault(syncedDefault);
    }

    const rows = documents.map(doc => {
      const rawId = (doc as TemplateSyncRow)._id;
      if (!rawId) throw new Error('PostgresTemplatesSyncHandler: document._id is required');
      const id = rawId.toString();
      const { _id: _ignored, ...rest } = doc as TemplateSyncRow;
      return {
        _id: id,
        ...rest,
        properties: JSON.stringify(rest.properties ?? []),
        commonProperties: JSON.stringify(rest.commonProperties ?? []),
        processing: rest.processing ? JSON.stringify(rest.processing) : null,
      } as Record<string, unknown>;
    });

    await this.table.upsert(rows);

    const ids = rows.map(row => row._id as string);
    return this.table.whereIn('_id', ids).all();
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }

  private async unsetOtherDefault(document: Partial<TemplateSyncRow>): Promise<void> {
    if (!document.default) {
      return;
    }

    const currentDefault = await this.table.where({ default: true }).first();
    if (currentDefault && currentDefault._id !== document._id) {
      await this.table.where({ _id: currentDefault._id }).update({ default: false });
    }
  }
}
