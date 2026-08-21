import { Db } from 'mongodb';
import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import {
  BulkDeleteKeysByContext,
  TranslationsDataSource,
} from '#api/core/application/contracts/TranslationsDataSource.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { TranslationContextDiff } from '#api/core/domain/translation/TranslationContextDiff.js';
import { TranslationContextModel } from '#api/core/domain/translation/TranslationContextModel.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PostgresTranslationMapper, TranslationRow } from './PostgresTranslationMapper.js';

const NATURAL_KEY = ['tenant_id', 'language', 'key', 'context_id'];

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === '23505';

export class PostgresTranslationsDataSource
  extends PostgresDataSource<TranslationRow>
  implements TranslationsDataSource
{
  private readonly idGenerator: IdGenerator;

  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
    idGenerator: IdGenerator;
  }) {
    super('translations', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'translationsV2' },
    });
    this.idGenerator = deps.idGenerator;
  }

  private toRows(translations: Translation[]): TranslationRow[] {
    return translations.map(translation =>
      PostgresTranslationMapper.toDBO(translation, this.idGenerator.generate())
    );
  }

  private async load(query = this.table): Promise<Translation[]> {
    const rows = await query.all();
    return rows.map(PostgresTranslationMapper.toDomain);
  }

  async insert(translations: Translation[]): Promise<Translation[]> {
    if (!translations.length) {
      return translations;
    }

    try {
      await this.table.insert(this.toRows(translations));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicatedKeyError((error as Error).message);
      }
      throw error;
    }

    return translations;
  }

  async upsert(translations: Translation[]): Promise<Translation[]> {
    if (!translations.length) {
      return translations;
    }

    await this.table.upsert(this.toRows(translations), {
      columns: NATURAL_KEY,
      merge: ['value'],
    });
    return translations;
  }

  async getAll() {
    return this.load();
  }

  async getByLanguage(language: string) {
    return this.load(this.table.where({ language }));
  }

  async getByLanguageExcludingContextTypes(language: string, types: TranslationContext['type'][]) {
    if (!types.length) {
      return this.getByLanguage(language);
    }
    return this.load(this.table.where({ language }).whereNotIn('context_type', types));
  }

  async getByContext(context: string) {
    return this.load(this.table.where({ context_id: context }));
  }

  async getByLanguageAndContext(language: string, contextId: string) {
    return this.load(this.table.where({ language, context_id: contextId }));
  }

  async getContextAndKeys(contextId: string, keys: string[]) {
    if (!keys.length) {
      return [];
    }
    return this.load(this.table.where({ context_id: contextId }).whereIn('key', keys));
  }

  async deleteByContextId(contextId: string): Promise<void> {
    await this.table.where({ context_id: contextId }).delete();
  }

  async deleteByLanguage(language: string): Promise<void> {
    await this.table.where({ language }).delete();
  }

  async bulkDeleteKeysByContext(props: BulkDeleteKeysByContext): Promise<void> {
    await props.reduce(async (previous, { contextId, keysToDelete }) => {
      await previous;
      if (!keysToDelete.length) {
        return;
      }
      await this.table.where({ context_id: contextId }).whereIn('key', keysToDelete).delete();
    }, Promise.resolve());
  }

  async calculateNonexistentKeys(contextId: string, keys: string[]): Promise<string[]> {
    if (!keys.length) {
      return [];
    }

    const found = await this.table
      .where({ context_id: contextId })
      .whereIn('key', keys)
      .select(['key'])
      .all();
    const foundKeys = new Set(found.map(row => row.key));
    return keys.filter(key => !foundKeys.has(key));
  }

  async cloneForLanguage(from: LanguageISO6391, to: LanguageISO6391): Promise<void> {
    const source = await this.table.where({ language: from }).all();
    if (!source.length) {
      return;
    }

    const BATCH_SIZE = 500;
    const batches: TranslationRow[][] = [];
    for (let i = 0; i < source.length; i += BATCH_SIZE) {
      batches.push(source.slice(i, i + BATCH_SIZE));
    }
    await batches.reduce(async (previous, batch) => {
      await previous;
      await this.insertClonedBatch(batch, to);
    }, Promise.resolve());
  }

  private async insertClonedBatch(rows: TranslationRow[], to: LanguageISO6391): Promise<void> {
    await this.table.upsert(
      rows.map(row => ({
        ...row,
        _id: this.idGenerator.generate(),
        language: to,
      })),
      { columns: NATURAL_KEY, ignore: true }
    );
  }

  async getContext(
    contextInfo: TranslationContext,
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ): Promise<TranslationContextModel> {
    const translations = await this.getByContext(contextInfo.id);
    return TranslationContextModel.create(contextInfo, translations, languages, defaultLanguage);
  }

  async updateContext(context: TranslationContextModel): Promise<void> {
    const diff = context.getDiff();
    if (!diff.hasChanges()) {
      return;
    }
    await this.persistContextDiff(diff, context.getContextInfo());
  }

  private async persistContextDiff(
    diff: TranslationContextDiff,
    contextInfo: TranslationContext
  ): Promise<void> {
    if (diff.contextLabelChanged) {
      await this.table.where({ context_id: contextInfo.id }).update({
        context_label: contextInfo.label,
      });
    }
    if (diff.addedTranslations.length > 0) {
      await this.insert(diff.addedTranslations);
    }
    if (diff.updatedTranslations.length > 0) {
      await this.upsert(diff.updatedTranslations);
    }
    if (diff.deletedKeys.length > 0) {
      await this.table
        .where({ context_id: contextInfo.id })
        .whereIn('key', diff.deletedKeys)
        .delete();
    }
  }
}
