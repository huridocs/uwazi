import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const TemplateMigrationConfig: MigrationConfig = {
  mongoCollection: 'templates',
  pgTable: 'templates',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    return {
      _id,
      name: doc.name,
      properties: JSON.stringify(doc.properties ?? []),
      commonProperties: JSON.stringify(doc.commonProperties ?? []),
      color: doc.color ?? null,
      default: doc.default ?? false,
      entityViewPage: doc.entityViewPage ?? null,
      processing: doc.processing ? JSON.stringify(doc.processing) : null,
    };
  },
};
