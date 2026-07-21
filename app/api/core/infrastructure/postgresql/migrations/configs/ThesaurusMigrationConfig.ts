import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const ThesaurusMigrationConfig: MigrationConfig = {
  mongoCollection: 'dictionaries',
  pgTable: 'thesauri',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    return {
      _id,
      name: doc.name,
      values: JSON.stringify(doc.values ?? []),
    };
  },
};
