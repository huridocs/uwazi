import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';

export const csvBackendConfigs = [
  { name: 'Mongo', postgresCsv: false },
  { name: 'Postgres', postgresCsv: true },
];

export const csvJobBackendConfigs = [
  { name: 'Mongo', postgresCsv: false, postgresCore: false },
  { name: 'Postgres CSV', postgresCsv: true, postgresCore: false },
  { name: 'Postgres core', postgresCsv: false, postgresCore: true },
  { name: 'Postgres', postgresCsv: true, postgresCore: true },
];

export const CSV_STORE_COLLECTIONS = [
  'csv_imports',
  'csv_import_rows',
  'csv_import_row_errors',
  'csv_import_thesauri_values',
  'csv_import_relationships_pending_values',
  'csv_import_relationships_values',
] as const;

export const itWithContext = (name: string, fn: () => Promise<void>) => {
  it(name, async () => {
    await testingEnvironment.runWithContext(fn);
  });
};

export const applyCsvBackendFlags = (postgresCsv: boolean) => {
  testingTenants.changeCurrentTenant({
    featureFlags: { postgresCsv },
  });
};

export const applyCsvJobBackendFlags = (postgresCsv: boolean, postgresCore: boolean) => {
  testingTenants.changeCurrentTenant({
    featureFlags: { postgresCsv, postgresCore },
  });
};

export const clearCsvStores = async () => {
  await Promise.all(
    CSV_STORE_COLLECTIONS.map(async collectionName => {
      const collection = testingEnvironment.db.getCollection(collectionName);
      if (collection) {
        await collection.deleteMany({});
      }
    })
  );
  if (testingEnvironment.pgEnabled) {
    await testingPG.clear([...CSV_STORE_COLLECTIONS]);
  }
};
