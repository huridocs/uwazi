import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const f = getFixturesFactory();

const SUBMIT_JOB = 'SubmitOcrJobHandler';

type Features = { ocrOn?: boolean; serviceEnabled?: boolean };

const settings = ({ ocrOn = true, serviceEnabled = true }: Features = {}) => ({
  settings: [
    {
      languages: [{ key: 'en' as const, label: 'English', default: true }],
      features: ocrOn ? { ocr: { url: 'http://ocr' } } : {},
      ocrServiceEnabled: serviceEnabled,
    },
  ],
});

const record = (name: string, overrides: Record<string, unknown> = {}) => ({
  _id: f.id(name),
  sourceFile: f.id(`file-${name}`),
  filename: `${name}.pdf`,
  language: 'eng',
  status: 'queued',
  attempt: 0,
  lastUpdated: 1000,
  ...overrides,
});

const document = (name: string, extra: { language?: 'en' | 'fr' } = {}) =>
  f.document(name, {
    entity: 'entity',
    filename: `${name}.pdf`,
    mimetype: 'application/pdf',
    status: 'ready',
    totalPages: 1,
    ...extra,
  });

const withRecords = (records: object[], features?: Features): DBFixture => ({
  ...settings(features),
  entities: [f.entity('entity')],
  files: [
    document('scan', { language: 'en' }),
    document('french', { language: 'fr' }),
    document('noLanguage'),
    f.attachment('attachment', {
      entity: 'entity',
      filename: 'attachment.pdf',
      mimetype: 'application/pdf',
    }),
  ],
  ocr_records: records,
});

const selectBackend = (postgresCore: boolean) =>
  testingTenants.changeCurrentTenant({
    name: 'ocr-intake',
    featureFlags: { postgresCore },
  });

const setUpBackends = async () =>
  testingEnvironment.setUp(
    {},
    { postgres: true, postgresMirror: ['ocr_records', 'settings', 'files', 'entities'] }
  );

const storedRecords = async (postgresCore: boolean) => {
  const rows = postgresCore
    ? (await testingEnvironment.pg.getAllFrom('ocr_records')).map(row => ({
        id: String(row._id),
        sourceFileId: row.source_file_id ? String(row.source_file_id) : null,
        language: String(row.language),
        status: String(row.status),
        attempt: Number(row.attempt),
        requestedAt: row.requested_at ? Number(row.requested_at) : undefined,
        failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
      }))
    : (await testingEnvironment.db.getAllFrom('ocr_records')).map(doc => ({
        id: String(doc._id),
        sourceFileId: doc.sourceFile ? String(doc.sourceFile) : null,
        language: String(doc.language),
        status: String(doc.status),
        attempt: Number(doc.attempt),
        requestedAt: doc.requestedAt as number | undefined,
        failureReason: doc.failureReason as string | undefined,
      }));
  return rows.sort((a, b) => a.id.localeCompare(b.id));
};

/** The SubmitOcr jobs dispatched, with their params and when they may first run. */
const submitJobs = async (postgresCore: boolean) =>
  (await testingEnvironment.jobs.getAll({ postgresCore }))
    .filter(job => job.name === SUBMIT_JOB)
    .map(job => ({
      params: typeof job.params === 'string' ? JSON.parse(job.params) : job.params,
      lockedUntil: Number(job.lockedUntil),
    }));

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

export {
  f,
  settings,
  record,
  withRecords,
  selectBackend,
  setUpBackends,
  storedRecords,
  submitJobs,
  testConfigs,
};
