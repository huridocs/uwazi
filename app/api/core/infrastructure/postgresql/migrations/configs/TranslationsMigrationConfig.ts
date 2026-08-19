import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

type TranslationContextDoc = {
  id?: string;
  type?: string;
  label?: string;
};

export const TranslationsMigrationConfig: MigrationConfig = {
  mongoCollection: 'translationsV2',
  pgTable: 'translations',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    const context = (doc.context ?? {}) as TranslationContextDoc;
    return {
      _id,
      language: doc.language,
      key: doc.key,
      value: doc.value ?? '',
      context_id: context.id,
      context_type: context.type,
      context_label: context.label,
    };
  },
};
