import { config } from '#api/config.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { tenants } from '#api/tenants/tenantContext.js';

const CSV_V2_JOB_HANDLER_NAMES = [
  'CsvExtractUploadedZipJobHandler',
  'CsvPreflightJobHandler',
  'CsvCreateThesauriValuesJobHandler',
  'CsvCreateRelationshipEntitiesJobHandler',
  'CsvImportEntitiesJobHandler',
  'CsvCleanupImportFilesJobHandler',
];

export const cleanupCsvV2QueueJobsByImportIds = async (importIds: string[]): Promise<void> => {
  if (!importIds.length) {
    return;
  }

  await getSharedConnection()
    .collection('jobs')
    .deleteMany({
      queue: config.queueName,
      namespace: tenants.current().name,
      name: { $in: CSV_V2_JOB_HANDLER_NAMES },
      'params.importId': { $in: importIds },
    });
};
