// eslint-disable-next-line no-restricted-imports
import fs from 'fs/promises';
import path from 'path';
import { gunzipSync } from 'zlib';
import { config } from '#api/config.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ArchiveActivityOverflowFactory } from '../../infrastructure/factories/ArchiveActivityOverflowFactory.js';
import { seed, setUpBackends, storedIn, StoredEntry } from './ActivityLogContractFixtures.js';

/** Entries made one after the other, from time 1. */
const entries = (count: number): StoredEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    method: 'POST',
    url: `/api/${index + 1}`,
    body: '{}',
    time: index + 1,
  }));

const SYSTEM_LIMITS = { ...config.activityLog };

describe('ArchiveActivityOverflow', () => {
  const archive = async () =>
    testingEnvironment.runWithContext(async () =>
      ArchiveActivityOverflowFactory.default().execute()
    );

  const folder = () => testingTenants.current().activityLogs;

  const archivedFiles = async () =>
    (await fs.readdir(folder())).filter(name => name.endsWith('_activity.jsonl.gz')).sort();

  const urlsIn = async (filename: string) =>
    gunzipSync(await fs.readFile(path.join(folder(), filename)))
      .toString()
      .split('\n')
      .filter(line => line !== '')
      .map(line => JSON.parse(line).url);

  const keptUrls = async (postgresCore = true) =>
    (await storedIn(postgresCore)).map(entry => entry.url);

  /** Every case starts with an empty archive folder of its own. */
  const setUp = async (postgresCore: boolean, count: number) => {
    await testingEnvironment.setupTenantTmpPaths([]);
    await seed(postgresCore, entries(count));
  };

  beforeAll(async () => {
    await setUpBackends();
    Object.assign(config.activityLog, { maxRows: 4, chunkRows: 3 });
  });

  afterAll(async () => {
    Object.assign(config.activityLog, SYSTEM_LIMITS);
    await testingEnvironment.tearDown();
  });

  it('should archive nothing while the tenant holds no more than it may keep', async () => {
    await setUp(true, 4);

    expect(await archive()).toEqual({ archivedRows: 0, files: [] });
    expect(await archivedFiles()).toEqual([]);
    expect(await keptUrls()).toHaveLength(4);
  });

  it('should wait until the overflow fills a whole file', async () => {
    await setUp(true, 6);

    expect(await archive()).toEqual({ archivedRows: 0, files: [] });
    expect(await archivedFiles()).toEqual([]);
    expect(await keptUrls()).toHaveLength(6);
  });

  it('should move the oldest entries to a file once the overflow fills one', async () => {
    await setUp(true, 7);

    const result = await archive();

    expect(result).toEqual({
      archivedRows: 3,
      files: ['1_3_000000000000000000000001_activity.jsonl.gz'],
    });
    expect(await archivedFiles()).toEqual(result.files);
    expect(await urlsIn(result.files[0])).toEqual(['/api/1', '/api/2', '/api/3']);
    expect(await keptUrls()).toEqual(['/api/4', '/api/5', '/api/6', '/api/7']);
  });

  it('should fill as many whole files as the overflow allows, and keep the rest', async () => {
    await setUp(true, 12);

    const result = await archive();

    expect(result.archivedRows).toBe(6);
    expect(result.files).toHaveLength(2);
    expect(await urlsIn(result.files[0])).toEqual(['/api/1', '/api/2', '/api/3']);
    expect(await urlsIn(result.files[1])).toEqual(['/api/4', '/api/5', '/api/6']);
    expect(await keptUrls()).toEqual([
      '/api/7',
      '/api/8',
      '/api/9',
      '/api/10',
      '/api/11',
      '/api/12',
    ]);
  });

  it('should archive nothing more when run again', async () => {
    await setUp(true, 7);
    await archive();

    expect(await archive()).toEqual({ archivedRows: 0, files: [] });
    expect(await archivedFiles()).toHaveLength(1);
  });

  it('should replace the file of entries that were archived but could not be removed', async () => {
    await setUp(true, 7);
    const [leftBehind] = (await archive()).files;
    await seed(true, entries(7));

    const result = await archive();

    expect(result.files).toEqual([leftBehind]);
    expect(await archivedFiles()).toEqual([leftBehind]);
    expect(await keptUrls()).toHaveLength(4);
  });

  it('should keep the entries when their file cannot be stored', async () => {
    await setUp(true, 7);
    const notAFolder = path.join(folder(), 'not-a-folder');
    await fs.writeFile(notAFolder, '');
    testingTenants.changeCurrentTenant({
      activityLogs: notAFolder,
      featureFlags: { postgresCore: true },
    });

    await expect(archive()).rejects.toThrow(/ENOTDIR/);
    expect(await keptUrls()).toHaveLength(7);
  });
});
