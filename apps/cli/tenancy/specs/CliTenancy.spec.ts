import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { CliTenancy } from '../CliTenancy.js';
import { TenantNotFound } from '../TenantNotFound.js';

const tenantsCollection = () => DB.mongodb_Db(config.SHARED_DB).collection('tenants');

const storedTenants = [
  { name: 'cli-tenant-a', dbName: 'cli-tenant-a', indexName: 'cli-tenant-a', domain: 'a.test' },
  {
    name: 'cli-tenant-b',
    dbName: 'cli-tenant-b',
    indexName: 'cli-tenant-b',
    domain: 'b.test',
    featureFlags: { postgresCore: true },
  },
];

describe('CliTenancy', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
    testingTenants.restoreCurrentFn();
    await tenantsCollection().deleteMany({ name: { $in: storedTenants.map(t => t.name) } });
    await tenantsCollection().insertMany(storedTenants.map(t => ({ ...t })));
  });

  afterAll(async () => {
    await tenantsCollection().deleteMany({ name: { $in: storedTenants.map(t => t.name) } });
    await testingEnvironment.tearDown();
  });

  describe('resolve()', () => {
    it('should read the tenant from the shared database', async () => {
      const tenant = await CliTenancy.resolve('cli-tenant-b');

      expect(tenant).toMatchObject({
        name: 'cli-tenant-b',
        dbName: 'cli-tenant-b',
        domain: 'b.test',
        featureFlags: expect.objectContaining({ postgresCore: true }),
      });
    });

    it('should fail with TenantNotFound for an unknown tenant', async () => {
      await expect(CliTenancy.resolve('does-not-exist')).rejects.toThrow(TenantNotFound);
      await expect(CliTenancy.resolve('does-not-exist')).rejects.toMatchObject({
        code: 'tenant.not_found',
        category: 'not_found',
      });
    });
  });

  describe('all()', () => {
    it('should return every stored tenant', async () => {
      const names = (await CliTenancy.all()).map(t => t.name);

      expect(names).toEqual(expect.arrayContaining(['cli-tenant-a', 'cli-tenant-b']));
    });
  });

  describe('run()', () => {
    it('should run as the system actor inside both tenant contexts', async () => {
      const tenant = await CliTenancy.resolve('cli-tenant-a');

      const seen = await CliTenancy.run(tenant, async () => ({
        legacy: tenants.current().name,
        context: ExecutionContext.tenant.name,
        system: ExecutionContext.actor?.isSystem(),
      }));

      expect(seen).toEqual({ legacy: 'cli-tenant-a', context: 'cli-tenant-a', system: true });
    });

    it('should log to stderr, never stdout', async () => {
      const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const tenant = await CliTenancy.resolve('cli-tenant-a');
      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await CliTenancy.run(tenant, async () => {
          ExecutionContext.logger.info('from a command');
        });

        expect(stdout).not.toHaveBeenCalled();
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining('from a command'));
      } finally {
        process.env.NODE_ENV = nodeEnv;
        stdout.mockRestore();
        stderr.mockRestore();
      }
    });
  });
});
