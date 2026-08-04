import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const RelationshipTypesMigrationConfig: MigrationConfig = {
  mongoCollection: 'relationtypes',
  pgTable: 'relationship_types',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    return {
      _id,
      name: doc.name,
    };
  },
};
