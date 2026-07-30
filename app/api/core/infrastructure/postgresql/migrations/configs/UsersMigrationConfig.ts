import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const UsersMigrationConfig: MigrationConfig = {
  mongoCollection: 'users',
  pgTable: 'users',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);

    return {
      _id,
      username: doc.username,
      password: doc.password,
      email: doc.email,
      role: doc.role,
      failedLogins: doc.failedLogins,
      accountLocked: doc.accountLocked,
      accountUnlockCode: doc.accountUnlockCode,
      using2fa: doc.using2fa ?? false,
      secret: doc.secret,
      deletedAt: doc.deletedAt,
    };
  },
};
