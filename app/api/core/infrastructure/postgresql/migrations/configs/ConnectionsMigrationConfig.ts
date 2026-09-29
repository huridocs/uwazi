import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

const toIdString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  return value instanceof ObjectId ? value.toHexString() : String(value);
};

const toJsonbValue = (value: unknown): unknown | null => {
  if (value === undefined || value === null) return null;
  return typeof value === 'object' ? value : JSON.stringify(value);
};

export const ConnectionsMigrationConfig: MigrationConfig = {
  mongoCollection: 'connections',
  pgTable: 'connections',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: toIdString(doc._id),
      entity: doc.entity ?? null,
      hub: toIdString(doc.hub),
      template: toIdString(doc.template),
      file: toIdString(doc.file),
      metadata: doc.metadata ?? {},
      reference: doc.reference ?? null,
      sharedId: toIdString(doc.sharedId),
      filename: typeof doc.filename === 'string' ? doc.filename : null,
      range: toJsonbValue(doc.range),
    };
  },
};
