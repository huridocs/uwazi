import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const f = getFixturesFactory();

const REQUEST_JOB = 'RequestSegmentationJobHandler';

const settings = (segmentationOn: boolean) => ({
  settings: [
    {
      languages: [{ key: 'en' as const, label: 'English', default: true }],
      features: segmentationOn ? { segmentation: { url: 'http://segmentation' } } : {},
    },
  ],
});

const idle = (name: string) => ({
  _id: f.id(name),
  fileID: f.id(`file-${name}`),
  filename: `${name}.pdf`,
  status: 'idle',
  attempt: 0,
  autoexpire: null,
});

const withSegmentations = (segmentationOn: boolean, segmentations: object[]): DBFixture => ({
  ...settings(segmentationOn),
  segmentations,
});

const useBackend = (postgresCore: boolean) =>
  testingTenants.changeCurrentTenant({
    name: 'segmentation-intake',
    featureFlags: { postgresCore },
  });

const setUpBackends = async () =>
  testingEnvironment.setUp({}, { postgres: true, postgresMirror: ['segmentations', 'settings'] });

/** What either backend holds, reduced to what intake decides, sorted by file. */
const storedSegmentations = async (postgresCore: boolean) => {
  const rows = postgresCore
    ? (await testingEnvironment.pg.getAllFrom('segmentations')).map(row => ({
        id: String(row._id),
        fileId: String(row.file_id),
        filename: String(row.filename),
        status: String(row.status),
      }))
    : (await testingEnvironment.db.getAllFrom('segmentations')).map(doc => ({
        id: String(doc._id),
        fileId: String(doc.fileID),
        filename: String(doc.filename),
        status: String(doc.status),
      }));
  return rows.sort((a, b) => a.fileId.localeCompare(b.fileId));
};

/** The segmentation ids of the RequestSegmentation jobs dispatched, sorted. */
const requestedSegmentationIds = async (postgresCore: boolean) => {
  const jobs = await testingEnvironment.jobs.getAll({ postgresCore });
  return jobs
    .filter(job => job.name === REQUEST_JOB)
    .map(job => (typeof job.params === 'string' ? JSON.parse(job.params) : job.params))
    .map(params => params.segmentationId as string)
    .sort();
};

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

export {
  f,
  settings,
  idle,
  withSegmentations,
  useBackend,
  setUpBackends,
  storedSegmentations,
  requestedSegmentationIds,
  testConfigs,
};
