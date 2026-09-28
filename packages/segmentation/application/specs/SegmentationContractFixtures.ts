import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

/**
 * The single fixture set behind both segmentation contract suites.
 *
 * Declared in the shape Mongo stores — which is also the shape every segmentation written before
 * this module has — and mirrored into Postgres through the `segmentations` migration config, so one
 * declaration serves both backends. Two records are deliberately legacy: `legacyReady` has no
 * attempt, no segment types and one document-wide page size, `legacyClaim` is a claim left by the
 * old dispatch loop.
 */

const f = getFixturesFactory();

const TENANT_ID = 'segmentation-contract';

const UNKNOWN_ID = 'ffffffffffffffffffffffff';
const MALFORMED_ID = 'not-a-valid-id';

const segment = (overrides: Record<string, unknown>) => ({
  left: 10,
  top: 20,
  width: 100,
  height: 12,
  page_number: 1,
  text: '',
  ...overrides,
});

const fixtures: DBFixture = {
  segmentations: [
    {
      _id: f.id('readyA'),
      fileID: f.id('fileA'),
      filename: 'a.pdf',
      xmlname: 'a.xml',
      status: 'ready',
      attempt: 1,
      requestedAt: 1000,
      autoexpire: null,
      segmentation: {
        page_width: 612,
        page_height: 792,
        paragraphs: [
          segment({ text: 'Title A', type: 'Title', page_width: 612, page_height: 792 }),
          segment({
            page_number: 2,
            text: 'Item',
            type: 'List item',
            page_width: 842,
            page_height: 595,
          }),
        ],
      },
    },
    {
      _id: f.id('legacyReady'),
      fileID: f.id('fileB'),
      filename: 'b.pdf',
      xmlname: 'b.xml',
      status: 'ready',
      autoexpire: null,
      segmentation: {
        page_width: 600,
        page_height: 800,
        paragraphs: [segment({ text: 'Legacy' })],
      },
    },
    {
      _id: f.id('failed'),
      fileID: f.id('fileC'),
      filename: 'c.pdf',
      status: 'failed',
      attempt: 1,
      requestedAt: 1000,
      failureReason: 'not_a_pdf',
      autoexpire: null,
    },
    {
      _id: f.id('staleProcessing'),
      fileID: f.id('fileD'),
      filename: 'd.pdf',
      status: 'processing',
      attempt: 2,
      requestedAt: 1000,
      autoexpire: null,
    },
    {
      _id: f.id('recentProcessing'),
      fileID: f.id('fileE'),
      filename: 'e.pdf',
      status: 'processing',
      attempt: 1,
      requestedAt: 5000,
      autoexpire: null,
    },
    {
      _id: f.id('idle1'),
      fileID: f.id('fileF'),
      filename: 'f.pdf',
      status: 'idle',
      attempt: 0,
      autoexpire: null,
    },
    {
      _id: f.id('idle2'),
      fileID: f.id('fileG'),
      filename: 'g.pdf',
      status: 'idle',
      attempt: 0,
      autoexpire: null,
    },
    {
      _id: f.id('queued'),
      fileID: f.id('fileH'),
      filename: 'h.pdf',
      status: 'queued',
      attempt: 0,
      autoexpire: null,
    },
    {
      _id: f.id('legacyClaim'),
      fileID: f.id('fileI'),
      filename: 'i.pdf',
      status: 'processing',
      autoexpire: new Date(),
    },
  ],
};

type StoredSegmentation = { id: string; fileId: string; status: string; attempt: number };

/**
 * What either backend holds, read around the code under test and reduced to the fields both
 * share. Sorted by id: neither backend orders rows on its own.
 */
const storedSegmentations = async (usePostgres: boolean): Promise<StoredSegmentation[]> => {
  const rows = usePostgres
    ? (await testingEnvironment.pg.getAllFrom('segmentations')).map(row => ({
        id: String(row._id),
        fileId: String(row.file_id),
        status: String(row.status),
        attempt: Number(row.attempt),
      }))
    : (await testingEnvironment.db.getAllFrom('segmentations')).map(doc => ({
        id: String(doc._id),
        fileId: String(doc.fileID),
        status: String(doc.status),
        attempt: Number(doc.attempt ?? 0),
      }));

  return rows.sort((a, b) => a.id.localeCompare(b.id));
};

const byFileId = <T extends { fileId: string }>(items: T[]) =>
  [...items].sort((a, b) => a.fileId.localeCompare(b.fileId));

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
  storedSegmentations,
  byFileId,
  testConfigs,
  selectBackend,
};
export type { StoredSegmentation };
