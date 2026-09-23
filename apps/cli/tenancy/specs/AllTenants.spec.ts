import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ExitCode } from '../../errors/ExitCode.js';
import { AllTenants } from '../AllTenants.js';
import { TenantNotFound } from '../TenantNotFound.js';

const NAMES = ['all-tenants-a', 'all-tenants-b'];

const tenantsCollection = () => DB.mongodb_Db(config.SHARED_DB).collection('tenants');

describe('AllTenants', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
    testingTenants.restoreCurrentFn();
    await tenantsCollection().deleteMany({ name: { $in: NAMES } });
    await tenantsCollection().insertMany(
      NAMES.map(name => ({ name, dbName: name, indexName: name, domain: `${name}.test` }))
    );
  });

  afterAll(async () => {
    await tenantsCollection().deleteMany({ name: { $in: NAMES } });
    await testingEnvironment.tearDown();
  });

  const ours = <T extends { tenant: string }>(entries: T[]) =>
    entries.filter(entry => NAMES.includes(entry.tenant));

  it('should run inside each tenant and collect its result', async () => {
    const results = await AllTenants.collect(async () => ExecutionContext.tenant.domain);

    expect(ours(results.results)).toEqual([
      { tenant: 'all-tenants-a', data: 'all-tenants-a.test' },
      { tenant: 'all-tenants-b', data: 'all-tenants-b.test' },
    ]);
  });

  it('should keep going when a tenant fails, reporting its error', async () => {
    const results = await AllTenants.collect(async () => {
      if (ExecutionContext.tenant.name === 'all-tenants-a') {
        throw new TenantNotFound('inner');
      }
      return 'ok';
    });

    expect(ours(results.results)).toEqual([{ tenant: 'all-tenants-b', data: 'ok' }]);
    expect(ours(results.errors)).toEqual([
      {
        tenant: 'all-tenants-a',
        error: { code: 'tenant.not_found', category: 'not_found', message: expect.any(String) },
      },
    ]);
  });

  describe('exitCode()', () => {
    it('should be Ok when no tenant failed', () => {
      expect(AllTenants.exitCode({ results: [], errors: [] })).toBe(ExitCode.Ok);
    });

    it('should follow the first failure category otherwise', () => {
      expect(
        AllTenants.exitCode({
          results: [],
          errors: [{ tenant: 'a', error: { code: 'x', category: 'not_found', message: 'm' } }],
        })
      ).toBe(ExitCode.NotFound);
    });
  });
});
