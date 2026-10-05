import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FailStaleOcrRecordsFactory } from '../../infrastructure/factories/FailStaleOcrRecordsFactory.js';
import {
  f,
  record,
  withRecords,
  selectBackend,
  setUpBackends,
  storedRecords,
  testConfigs,
} from './OcrIntakeFixtures.js';

const HOUR = 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

const processing = (name: string, hoursAgo: number, overrides: object = {}) =>
  record(name, {
    status: 'processing',
    attempt: 1,
    requestedAt: NOW - hoursAgo * HOUR,
    lastUpdated: NOW - hoursAgo * HOUR,
    ...overrides,
  });

describe('FailStaleOcrRecords', () => {
  const sockets = {
    emitToTenant: jest.fn(),
    emitToTenantAdmins: jest.fn(),
    emitToTenantAdminsAndEditors: jest.fn(),
    emitToSession: jest.fn(),
  };

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (records: object[]) => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withRecords(records));
    };

    const execute = async (batchSize?: number) =>
      testingEnvironment.runWithContext(async () =>
        FailStaleOcrRecordsFactory.default({ sockets, now: () => NOW, batchSize }).execute()
      );

    const byName = async () =>
      Object.fromEntries((await storedRecords(postgresCore)).map(r => [r.id, r]));

    it('should time out the records processing for over a day, leaving the others alone', async () => {
      await setUp([
        processing('stale', 25),
        processing('recent', 23),
        record('queued', { lastUpdated: NOW - 48 * HOUR }),
        record('ready', { status: 'ready', attempt: 1, resultFile: f.id('result') }),
      ]);

      const count = await execute();

      const stored = await byName();
      expect(count).toBe(1);
      expect(stored[f.idString('stale')]).toMatchObject({
        status: 'failed',
        failureReason: 'timeout',
      });
      expect(stored[f.idString('recent')].status).toBe('processing');
      expect(stored[f.idString('queued')].status).toBe('queued');
      expect(stored[f.idString('ready')].status).toBe('ready');
    });

    it('should tell the editors about each record it timed out', async () => {
      await setUp([processing('staleA', 30), processing('staleB', 26)]);

      await execute();

      expect(sockets.emitToTenantAdminsAndEditors.mock.calls.map(call => call.slice(0, 3))).toEqual(
        expect.arrayContaining([
          [testingTenants.current().name, 'ocr:error', f.idString('file-staleA')],
          [testingTenants.current().name, 'ocr:error', f.idString('file-staleB')],
        ])
      );
      expect(sockets.emitToTenantAdminsAndEditors).toHaveBeenCalledTimes(2);
    });

    it('should time out a record whose source file is gone, without telling anyone', async () => {
      await setUp([processing('orphan', 30, { sourceFile: null, resultFile: f.id('result') })]);

      await execute();

      expect((await byName())[f.idString('orphan')].status).toBe('failed');
      expect(sockets.emitToTenantAdminsAndEditors).not.toHaveBeenCalled();
    });

    it('should work through more stale records than one batch holds', async () => {
      await setUp([processing('a', 30), processing('b', 31), processing('c', 32)]);

      const count = await execute(2);

      expect(count).toBe(3);
      expect((await storedRecords(postgresCore)).map(r => r.status)).toEqual([
        'failed',
        'failed',
        'failed',
      ]);
    });

    it('should do nothing when no record is stale', async () => {
      await setUp([processing('recent', 1)]);

      expect(await execute()).toBe(0);
      expect(sockets.emitToTenantAdminsAndEditors).not.toHaveBeenCalled();
    });
  });
});
