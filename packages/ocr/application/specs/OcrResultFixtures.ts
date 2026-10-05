import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const f = getFixturesFactory();

const TENANT_ID = 'ocr-result';

const SOURCE = 'scan';
const FILENAME = 'scan.pdf';

const withProcessing = (
  record: Record<string, unknown> = {},
  source: object | null = null
): DBFixture => ({
  settings: [{ languages: [{ key: 'en' as const, label: 'English', default: true }] }],
  entities: [f.entity('entity')],
  files: [
    source ?? {
      ...f.document(SOURCE, {
        entity: 'entity',
        filename: FILENAME,
        originalname: FILENAME,
        mimetype: 'application/pdf',
        status: 'ready',
        totalPages: 1,
        language: 'en',
      }),
    },
  ],
  connections: [
    {
      _id: f.id('textRef'),
      entity: 'entity',
      hub: f.id('hub'),
      template: null,
      file: f.idString(SOURCE),
    },
    {
      _id: f.id('otherRef'),
      entity: 'entity',
      hub: f.id('hub'),
      template: null,
      file: f.idString('other'),
    },
  ],
  ocr_records: [
    {
      _id: f.id('record'),
      sourceFile: f.id(SOURCE),
      filename: FILENAME,
      language: 'eng',
      status: 'processing',
      attempt: 2,
      requestedAt: 1000,
      lastUpdated: 1000,
      ...record,
    },
  ],
});

const selectBackend = (postgresCore: boolean) =>
  testingTenants.changeCurrentTenant({ name: TENANT_ID, featureFlags: { postgresCore } });

const setUpBackends = async () =>
  testingEnvironment.setUp(
    {},
    {
      postgres: true,
      postgresMirror: ['ocr_records', 'settings', 'files', 'entities', 'connections'],
    }
  );

const storedFiles = async () =>
  (await testingEnvironment.db.getAllFrom('files'))
    .map(file => ({
      id: String(file._id),
      type: String(file.type),
      filename: String(file.filename),
      originalname: String(file.originalname),
      status: file.status ? String(file.status) : undefined,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

const storedReferences = async () =>
  (await testingEnvironment.db.getAllFrom('connections'))
    .map(ref => ({ id: String(ref._id), file: ref.file ? String(ref.file) : undefined }))
    .sort((a, b) => a.id.localeCompare(b.id));

const storedRecord = async (postgresCore: boolean) => {
  if (postgresCore) {
    const [row] = await testingEnvironment.pg.getAllFrom('ocr_records');
    return {
      status: String(row.status),
      attempt: Number(row.attempt),
      resultFileId: row.result_file_id ? String(row.result_file_id) : undefined,
      failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
    };
  }
  const [doc] = await testingEnvironment.db.getAllFrom('ocr_records');
  return {
    status: String(doc.status),
    attempt: Number(doc.attempt),
    resultFileId: doc.resultFile ? String(doc.resultFile) : undefined,
    failureReason: doc.failureReason as string | undefined,
  };
};

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

export {
  f,
  SOURCE,
  FILENAME,
  withProcessing,
  selectBackend,
  setUpBackends,
  storedFiles,
  storedReferences,
  storedRecord,
  testConfigs,
};
