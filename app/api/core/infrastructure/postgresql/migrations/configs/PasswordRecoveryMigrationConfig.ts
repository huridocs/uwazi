import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const PasswordRecoveryMigrationConfig: MigrationConfig = {
  mongoCollection: 'passwordrecoveries',
  pgTable: 'password_recoveries',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    const userId = doc.user instanceof ObjectId ? doc.user.toHexString() : String(doc.user);

    return {
      _id,
      key: doc.key,
      userId,
      expiresAt: doc.expiresAt,
    };
  },
};
