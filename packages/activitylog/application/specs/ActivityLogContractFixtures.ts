import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

/**
 * The entries behind the activity log contract suites, declared once as plain data and stored in
 * both backends: as the documents Mongo holds and as the rows Postgres holds.
 */
type StoredEntry = {
  method: string;
  url: string;
  params?: string;
  query?: string;
  body?: string;
  username?: string;
  time: number;
};

const TENANT = 'activitylog-contract';

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

const setUpBackends = async () => testingEnvironment.setUp({}, { postgres: true });

const selectBackend = (postgresCore: boolean) =>
  testingTenants.changeCurrentTenant({ name: TENANT, featureFlags: { postgresCore } });

/** Ids grow with the order entries are given in, as they do when entries are logged. */
const idOf = (index: number) => (index + 1).toString(16).padStart(24, '0');

/**
 * Selects the backend and leaves it holding exactly these entries. The other backend is left
 * empty, so a read that went to the wrong one finds nothing.
 */
const seed = async (postgresCore: boolean, entries: StoredEntry[]) => {
  selectBackend(postgresCore);
  await testingEnvironment.setFixtures(
    {
      activitylogs: postgresCore
        ? []
        : entries.map((entry, index) => ({ _id: new ObjectId(idOf(index)), ...entry })),
    },
    {
      activitylogs: postgresCore
        ? entries.map((entry, index) => ({
            _id: idOf(index),
            method: entry.method,
            url: entry.url,
            params: entry.params ?? null,
            query: entry.query ?? null,
            body: entry.body ?? null,
            user_id: null,
            username: entry.username ?? null,
            time: entry.time,
          }))
        : [],
    }
  );
};

const mongoDocuments = async () =>
  (await testingEnvironment.db.getCollection('activitylogs')?.find().toArray()) ?? [];

const postgresRows = async () => testingEnvironment.pg.getAllFrom('activitylogs');

/** What a backend holds, in one shape whichever it is, oldest first. */
const storedIn = async (postgresCore: boolean) =>
  (postgresCore
    ? (await postgresRows()).map(row => ({
        id: String(row._id),
        method: row.method,
        url: row.url,
        params: row.params,
        query: row.query,
        body: row.body,
        userId: row.user_id,
        username: row.username,
        time: Number(row.time),
      }))
    : (await mongoDocuments()).map(doc => ({
        id: String(doc._id),
        method: doc.method,
        url: doc.url,
        params: doc.params,
        query: doc.query,
        body: doc.body,
        userId: doc.user ? String(doc.user) : null,
        username: doc.username ?? null,
        time: doc.time,
      }))
  ).sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));

const T = {
  templatesPut: 1000011600000,
  entitiesDelete: 1100001600000,
  entitiesCreate: 1200002400000,
  entitiesHelloPut: 1300003200000,
  entitiesPut: 1400000400000,
  entitiesPost: 1500008400000,
};

const listEntries: StoredEntry[] = [
  {
    method: 'POST',
    url: '/api/entities',
    query: '{}',
    body: '{"title":"Hello"}',
    time: T.entitiesCreate,
    username: 'admin',
  },
  {
    method: 'PUT',
    url: '/api/entities',
    query: '{"name": "Hello"}',
    body: '{}',
    time: T.entitiesPut,
  },
  {
    method: 'PUT',
    url: '/api/entities/Hello',
    query: '{}',
    body: '{}',
    time: T.entitiesHelloPut,
  },
  {
    method: 'PUT',
    url: '/api/templates',
    query: '{}',
    body: '{}',
    time: T.templatesPut,
    username: 'Hello',
  },
  {
    method: 'DELETE',
    url: '/api/entities',
    query: '{"sharedId":"123"}',
    body: '{}',
    time: T.entitiesDelete,
    username: 'admin',
  },
  {
    method: 'POST',
    url: '/api/entities',
    query: '{"sharedId":"123"}',
    body: '{"_id":"456","title":"Entity 1"}',
    time: T.entitiesPost,
  },
];

/** Every entry, newest first. */
const NEWEST_FIRST = [
  T.entitiesPost,
  T.entitiesPut,
  T.entitiesHelloPut,
  T.entitiesCreate,
  T.entitiesDelete,
  T.templatesPut,
];

export {
  idOf,
  listEntries,
  mongoDocuments,
  NEWEST_FIRST,
  postgresRows,
  seed,
  selectBackend,
  setUpBackends,
  storedIn,
  T,
  testConfigs,
};
export type { StoredEntry };
