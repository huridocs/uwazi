// oxlint-disable max-statements
import waitForExpect from 'wait-for-expect';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PostgresTenantsChangeFeed } from '../PostgresTenantsChangeFeed.js';

const INTERVAL_MS = 50;
const QUIET_MS = INTERVAL_MS * 6;

const tenant = (name: string) => ({
  name,
  dbName: `${name}_db`,
  indexName: `${name}_index`,
  uploadedDocuments: 'a',
  attachments: 'b',
  customUploads: 'c',
  activityLogs: 'd',
});

const wait = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

describe('PostgresTenantsChangeFeed', () => {
  let feed: PostgresTenantsChangeFeed;
  let onChange: jest.Mock;
  let onError: jest.Mock;
  let knex: jest.Mock;

  const tenants = () => PostgresDB.knex('tenants');

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await tenants().del();
    await tenants().insert(tenant('one'));
    onChange = jest.fn();
    onError = jest.fn();
    knex = jest.fn(() => PostgresDB.knex);
    feed = new PostgresTenantsChangeFeed(knex, INTERVAL_MS);
  });

  afterEach(async () => {
    await feed.stop();
  });

  const started = async () => {
    await feed.start(onChange, onError);
  };

  it('should not report the registry as it was when it started', async () => {
    await started();

    await wait(QUIET_MS);

    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    ['a tenant is inserted', async () => tenants().insert(tenant('two'))],
    ['a tenant is deleted', async () => tenants().where({ name: 'one' }).del()],
    [
      'a feature flag changes',
      async () => tenants().update({ featureFlags: JSON.stringify({ postgresCore: true }) }),
    ],
    ['maintenance changes', async () => tenants().update({ maintenance: true })],
  ])('should report when %s', async (_case, write) => {
    await started();

    await write();

    await waitForExpect(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['stats', async () => tenants().update({ stats: JSON.stringify({ lastUpdated: 1 }) })],
    [
      'health checks',
      async () => tenants().update({ healthChecks: JSON.stringify([{ name: 'disk' }]) }),
    ],
    ['metadata', async () => tenants().update({ metadata: JSON.stringify({ orgName: 'Acme' }) })],
    ['identical values', async () => tenants().update({ dbName: 'one_db' })],
    [
      'stats written the way upsert writes them',
      async () =>
        tenants()
          .insert({ ...tenant('one'), stats: JSON.stringify({ lastUpdated: 2 }) })
          .onConflict('name')
          .merge(),
    ],
  ])('should not report a change to %s', async (_case, write) => {
    await started();

    await write();
    await wait(QUIET_MS);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should report several writes made within one interval', async () => {
    await started();

    await tenants().insert(tenant('two'));
    await tenants().insert(tenant('three'));

    await waitForExpect(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('should report nothing and run no query after it is stopped', async () => {
    await started();
    await feed.stop();
    const queries = knex.mock.calls.length;

    await tenants().insert(tenant('two'));
    await wait(QUIET_MS);

    expect(onChange).not.toHaveBeenCalled();
    expect(knex).toHaveBeenCalledTimes(queries);
  });

  it('should report a failed poll, keep polling and still report a change made meanwhile', async () => {
    await started();
    knex.mockImplementation(() => {
      throw new Error('connection is gone');
    });

    await tenants().insert(tenant('two'));
    await waitForExpect(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'connection is gone' })
      );
    });
    expect(onChange).not.toHaveBeenCalled();
    knex.mockImplementation(() => PostgresDB.knex);

    await waitForExpect(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  it('should fail to start when the registry has no version counter', async () => {
    const pool = testingEnvironment.pg.pool!;
    await pool.query('ALTER TABLE tenants_version RENAME TO tenants_version_off');
    try {
      await expect(feed.start(onChange, onError)).rejects.toThrow();
    } finally {
      await pool.query('ALTER TABLE tenants_version_off RENAME TO tenants_version');
    }
  });
});
