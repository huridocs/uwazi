import { ObjectId } from 'mongodb';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB, DBFixture } from '#api/utils/testing_db.js';

/**
 * The fixture set behind the DatavizDataSource and DatavizSnapshotsDataSource contract suites.
 * Declared in the Mongo shape; `testingEnvironment.setFixtures` mirrors `dataviz` and
 * `dataviz_snapshots` into Postgres through their migration configs.
 */

const TENANT_ID = 'dataviz-contract';

const testConfigs = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const ids = {
  sales: new ObjectId(),
  manual: new ObjectId(),
  missing: new ObjectId().toHexString(),
};

const query = {
  sources: [{ templateId: new ObjectId().toHexString() }],
  dimensions: [{ property: 'country' }],
  measures: [{ aggregation: 'count' }],
} as DatavizDefinition['query'];

const chart: DatavizDefinition['chart'] = { type: 'bar' };
const appearance: DatavizDefinition['appearance'] = { colorMode: 'theme' };
const refresh: DatavizDefinition['refresh'] = {
  refreshMode: 'snapshot_scheduled',
  schedule: 'daily',
  lastRefreshedAt: '2026-01-01T00:00:00.000Z',
};

const createdAt = Date.UTC(2026, 0, 1);
const updatedAt = Date.UTC(2026, 0, 2);

const payload = { data: { datavizId: ids.sales.toHexString(), series: [] }, chart };

const fixtures: DBFixture = {
  dataviz: [
    {
      _id: ids.sales,
      name: 'Sales',
      description: 'Sales by country',
      dataSource: 'query',
      query,
      chart,
      appearance,
      refresh,
      processing: { active: false },
      embedPublic: true,
      createdAt,
      updatedAt,
    },
    {
      _id: ids.manual,
      name: 'Manual',
      query,
      chart,
      appearance,
      refresh: { refreshMode: 'snapshot_manual' },
      createdAt,
      updatedAt,
    },
  ],
  dataviz_snapshots: [
    {
      _id: ids.sales,
      datavizId: ids.sales,
      queryHash: 'sales-hash',
      payload,
      generatedAt: createdAt,
    },
  ],
};

/** Definitions as the data sources must return them, independent of the backend. */
const definitions: Record<'sales' | 'manual', DatavizDefinition> = {
  sales: {
    id: ids.sales.toHexString(),
    name: 'Sales',
    description: 'Sales by country',
    dataSource: 'query',
    query,
    manualData: undefined,
    chart,
    appearance,
    refresh,
    processing: { active: false },
    embedPublic: true,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  },
  manual: {
    id: ids.manual.toHexString(),
    name: 'Manual',
    description: undefined,
    dataSource: 'query',
    query,
    manualData: undefined,
    chart,
    appearance,
    refresh: { refreshMode: 'snapshot_manual' },
    processing: undefined,
    embedPublic: false,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  },
};

type StoredDataviz = {
  _id: string;
  name: string;
  processing?: DatavizDefinition['processing'];
  refresh: DatavizDefinition['refresh'];
  embedPublic?: boolean;
  createdAt: number;
  updatedAt: number;
};

type StoredSnapshot = {
  _id: string;
  datavizId: string;
  queryHash: string;
  payload: object;
  generatedAt: number;
};

const toMillis = (value: unknown) => new Date(value as string | number | Date).getTime();

/** Raw stored rows of `table`, read straight from the backend under test. */
const storedRows = async (table: string, usePostgres: boolean) =>
  usePostgres
    ? testingEnvironment.pg.getAllFrom(table)
    : testingDB.mongodb!.collection(table).find().toArray();

const storedDataviz = async (usePostgres: boolean): Promise<StoredDataviz[]> =>
  (await storedRows('dataviz', usePostgres))
    .map(row => ({
      _id: String(row._id),
      name: row.name,
      processing: row.processing ?? undefined,
      refresh: row.refresh,
      embedPublic: row.embedPublic ?? undefined,
      createdAt: toMillis(row.createdAt),
      updatedAt: toMillis(row.updatedAt),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const storedSnapshots = async (usePostgres: boolean): Promise<StoredSnapshot[]> =>
  (await storedRows('dataviz_snapshots', usePostgres))
    .map(row => ({
      _id: String(row._id),
      datavizId: String(row.datavizId),
      queryHash: row.queryHash,
      payload: row.payload,
      generatedAt: toMillis(row.generatedAt),
    }))
    .sort((a, b) => a.datavizId.localeCompare(b.datavizId));

export {
  TENANT_ID,
  testConfigs,
  ids,
  query,
  chart,
  appearance,
  refresh,
  payload,
  createdAt,
  fixtures,
  definitions,
  storedDataviz,
  storedSnapshots,
};
