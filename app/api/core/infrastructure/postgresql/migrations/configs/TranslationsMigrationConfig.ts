import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

type TranslationContextDoc = {
  id?: unknown;
  type?: unknown;
  label?: unknown;
};

const requireContext = (doc: Record<string, unknown>) => {
  const context = (doc.context ?? {}) as TranslationContextDoc;
  const { id } = context;
  const { type } = context;
  const { label } = context;

  if (
    typeof id !== 'string' ||
    !id ||
    typeof type !== 'string' ||
    !type ||
    typeof label !== 'string' ||
    !label
  ) {
    const fields = `id=${JSON.stringify(id)}, type=${JSON.stringify(type)}, label=${JSON.stringify(label)}`;
    throw new Error(`translationsV2 document is missing required context fields (${fields})`);
  }

  return { id, type, label };
};

export const TranslationsMigrationConfig: MigrationConfig = {
  mongoCollection: 'translationsV2',
  pgTable: 'translations',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    const context = requireContext(doc);
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
