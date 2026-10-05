import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

/**
 * The single fixture set behind the OCR contract suites, declared once, in the shape
 * Mongo stores — already the normalized one the 213 migration produces — and mirrored into
 * Postgres through the `ocr_records` migration config.
 */

const f = getFixturesFactory();

const TENANT_ID = 'ocr-contract';

const UNKNOWN_ID = 'ffffffffffffffffffffffff';
const MALFORMED_ID = 'not-a-valid-id';

type Seed = {
  name: string;
  source: string | null;
  result?: string;
  filename: string;
  status: string;
  attempt: number;
  requestedAt?: number;
  lastUpdated: number;
  failureReason?: string;
};

const seeds: Seed[] = [
  {
    name: 'queued',
    source: 'fileA',
    filename: 'a.pdf',
    status: 'queued',
    attempt: 0,
    lastUpdated: 100,
  },
  {
    name: 'staleProcessing',
    source: 'fileB',
    filename: 'b.pdf',
    status: 'processing',
    attempt: 2,
    requestedAt: 1000,
    lastUpdated: 1000,
  },
  {
    name: 'recentProcessing',
    source: 'fileC',
    filename: 'c.pdf',
    status: 'processing',
    attempt: 1,
    requestedAt: 5000,
    lastUpdated: 5000,
  },
  {
    name: 'ready',
    source: 'fileD',
    result: 'resultD',
    filename: 'd.pdf',
    status: 'ready',
    attempt: 1,
    requestedAt: 1000,
    lastUpdated: 2000,
  },
  {
    name: 'failed',
    source: 'fileE',
    filename: 'e.pdf',
    status: 'failed',
    attempt: 1,
    requestedAt: 1000,
    lastUpdated: 2000,
    failureReason: 'invalidPdf',
  },
  {
    name: 'detached',
    source: null,
    result: 'resultF',
    filename: 'f.pdf',
    status: 'ready',
    attempt: 1,
    requestedAt: 1000,
    lastUpdated: 2000,
  },
];

const optionally = <T>(key: string, value: T | undefined, transform: (v: T) => unknown) =>
  value === undefined ? {} : { [key]: transform(value) };

const fixtures: DBFixture = {
  ocr_records: seeds.map(seed => ({
    _id: f.id(seed.name),
    sourceFile: seed.source === null ? null : f.id(seed.source),
    filename: seed.filename,
    language: 'eng',
    status: seed.status,
    attempt: seed.attempt,
    lastUpdated: seed.lastUpdated,
    ...optionally('resultFile', seed.result, f.id),
    ...optionally('requestedAt', seed.requestedAt, v => v),
    ...optionally('failureReason', seed.failureReason, v => v),
  })),
};

type StoredOcrRecord = {
  id: string;
  sourceFileId: string | null;
  status: string;
  attempt: number;
};

/**
 * What either backend holds, read around the code under test and reduced to the fields both
 * share. Sorted by id: neither backend orders rows on its own.
 */
const storedOcrRecords = async (usePostgres: boolean): Promise<StoredOcrRecord[]> => {
  const rows = usePostgres
    ? (await testingEnvironment.pg.getAllFrom('ocr_records')).map(row => ({
        id: String(row._id),
        sourceFileId: row.source_file_id ? String(row.source_file_id) : null,
        status: String(row.status),
        attempt: Number(row.attempt),
      }))
    : (await testingEnvironment.db.getAllFrom('ocr_records')).map(doc => ({
        id: String(doc._id),
        sourceFileId: doc.sourceFile ? String(doc.sourceFile) : null,
        status: String(doc.status),
        attempt: Number(doc.attempt),
      }));

  return rows.sort((a, b) => a.id.localeCompare(b.id));
};

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const selectBackend = (usePostgres: boolean) =>
  testingTenants.changeCurrentTenant({
    name: TENANT_ID,
    featureFlags: { postgresCore: usePostgres },
  });

export {
  f,
  TENANT_ID,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  storedOcrRecords,
  testConfigs,
  selectBackend,
};
export type { StoredOcrRecord };
