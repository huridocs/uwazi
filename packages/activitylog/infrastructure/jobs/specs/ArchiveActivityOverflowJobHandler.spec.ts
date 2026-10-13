// eslint-disable-next-line no-restricted-imports
import fs from 'fs/promises';
import { config } from '#api/config.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ArchiveActivityOverflow } from '../../../application/ArchiveActivityOverflow.js';
import {
  seed,
  setUpBackends,
  storedIn,
  StoredEntry,
} from '../../../application/specs/ActivityLogContractFixtures.js';
import { ArchiveActivityOverflowJobHandler } from '../ArchiveActivityOverflowJobHandler.js';

const entries: StoredEntry[] = Array.from({ length: 7 }, (_, index) => ({
  method: 'POST',
  url: `/api/${index + 1}`,
  body: '{}',
  time: index + 1,
}));

const SYSTEM_LIMITS = {
  maxRows: config.activityLog.maxRows,
  chunkRows: ArchiveActivityOverflow.CHUNK_ROWS,
};

/** The handler takes its limits from the system, so the system is given small ones. */
const setSystemLimits = ({ maxRows, chunkRows }: typeof SYSTEM_LIMITS) => {
  config.activityLog.maxRows = maxRows;
  Object.assign(ArchiveActivityOverflow, { CHUNK_ROWS: chunkRows });
};

describe('ArchiveActivityOverflowJobHandler', () => {
  beforeAll(async () => {
    await setUpBackends();
    setSystemLimits({ maxRows: 4, chunkRows: 3 });
  });

  afterAll(async () => {
    setSystemLimits(SYSTEM_LIMITS);
    await testingEnvironment.tearDown();
  });

  it('should archive the overflow of the tenant it runs for, under the system limits', async () => {
    await testingEnvironment.setupTenantTmpPaths([]);
    await seed(true, entries);

    await testingEnvironment.runWithContext(async () =>
      ArchiveActivityOverflowJobHandler.default().handleDispatch(async () => undefined, {})
    );

    expect(await fs.readdir(testingTenants.current().activityLogs)).toContain(
      '1_3_000000000000000000000001_activity.jsonl.gz'
    );
    expect((await storedIn(true)).map(entry => entry.url)).toEqual([
      '/api/4',
      '/api/5',
      '/api/6',
      '/api/7',
    ]);
  });
});
