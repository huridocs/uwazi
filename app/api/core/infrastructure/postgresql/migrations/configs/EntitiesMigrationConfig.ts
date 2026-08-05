import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const EntitiesMigrationConfig: MigrationConfig = {
  mongoCollection: 'entities',
  pgTable: 'entities',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    const template =
      doc.template instanceof ObjectId ? doc.template.toHexString() : String(doc.template);
    const user = doc.user instanceof ObjectId ? doc.user.toHexString() : doc.user || null;

    return {
      _id,
      sharedId: doc.sharedId,
      language: doc.language,
      title: doc.title,
      template,
      published: doc.published,
      generatedToc: doc.generatedToc ?? null,
      icon: doc.icon || { _id: null, type: '' },
      creationDate: doc.creationDate,
      editDate: doc.editDate,
      metadata: doc.metadata || {},
      user,
      permissions: doc.permissions || [],
      preview: doc.preview ?? null,
    };
  },
};
