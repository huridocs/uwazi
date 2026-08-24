import { Db } from 'mongodb';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { TranslationSyO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationSyO.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import {
  PostgresTranslationMapper,
  TranslationRow,
} from '#api/core/infrastructure/postgresql/translation/PostgresTranslationMapper.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SyncHandler } from './SyncHandler.js';

const toIdString = (id: unknown): string => {
  if (id == null) {
    throw new Error('PostgresTranslationsSyncHandler: document._id is required');
  }
  return String(id);
};

const toRow = (document: Partial<TranslationSyO>): TranslationRow => {
  const id = toIdString(document._id);
  if (!document.language || !document.key || !document.context?.id) {
    throw new Error(
      'PostgresTranslationsSyncHandler: language, key, and context.id are required to save'
    );
  }
  if (document.value == null) {
    throw new Error('PostgresTranslationsSyncHandler: document.value is required');
  }

  return PostgresTranslationMapper.toDBO(
    new Translation(
      document.key,
      document.value,
      document.language as LanguageISO6391,
      document.context
    ),
    id
  );
};

const toSyncDocument = (row: TranslationRow): TranslationSyO => ({
  _id: row._id,
  language: row.language,
  key: row.key,
  value: row.value,
  context: {
    id: row.context_id,
    type: row.context_type,
    label: row.context_label,
  },
});

export class PostgresTranslationsSyncHandler
  extends PostgresDataSource<TranslationRow>
  implements SyncHandler<TranslationSyO>
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('translations', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'translationsV2' },
    });
  }

  async getById(id: string): Promise<TranslationSyO | null> {
    const row = await this.table.where({ _id: id }).first();
    return row ? toSyncDocument(row) : null;
  }

  async save(document: Partial<TranslationSyO>): Promise<TranslationSyO> {
    const row = toRow(document);

    await this.table
      .where({
        language: row.language,
        key: row.key,
        context_id: row.context_id,
      })
      .delete();
    await this.table.insert(row);

    const saved = await this.table.where({ _id: row._id }).first();
    return toSyncDocument(saved!);
  }

  async saveMultiple(documents: Partial<TranslationSyO>[]): Promise<TranslationSyO[]> {
    return documents.reduce<Promise<TranslationSyO[]>>(async (previous, document) => {
      const saved = await previous;
      saved.push(await this.save(document));
      return saved;
    }, Promise.resolve([]));
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}
