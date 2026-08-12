import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTranslationsSyncDataSource } from '#api/core/infrastructure/mongodb/translation/MongoTranslationsSyncDataSource.js';
import { models } from '#api/odm/index.js';

/**
 * Registers the sync-facing translationsV2 model used by POST /api/sync.
 * Must run when sync routes load (see registerSyncHandlers).
 */
export function registerTranslationsV2SyncModel(): void {
  models.translationsV2 = () =>
    new MongoTranslationsSyncDataSource(getConnection(), TransactionManagerFactory.default());
}
