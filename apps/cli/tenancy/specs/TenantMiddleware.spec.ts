import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DB } from '#api/odm/index.js';
import { tenants as legacyTenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import type { CliContext } from '../../pipeline/CliContext.js';
import type { Middleware } from '../../pipeline/Middleware.js';
import { TenantMiddleware } from '../TenantMiddleware.js';
import { TenantNotFound } from '../TenantNotFound.js';

const NAMES = ['tenant-mw-a', 'tenant-mw-b'];

const tenantsCollection = () => DB.mongodb_Db(config.SHARED_DB).collection('tenants');

/** Stands in for the controller: records where it ran and sets a per-tenant result. */
const recorder = (seen: string[]): Middleware => ({
  async handle(context, next) {
    seen.push(`${legacyTenants.current().name}|${ExecutionContext.tenant.name}`);
    context.result = `result of ${ExecutionContext.tenant.name}`;
    await next();
  },
});

const context = (tenants?: CliContext['tenants']): CliContext => ({
  route: 'things list',
  input: {},
  json: true,
  tenants,
});

describe('TenantMiddleware', () => {
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

  it('should pass straight through for commands that are not tenant-scoped', async () => {
    const next = jest.fn().mockResolvedValue(undefined);

    await new TenantMiddleware([]).handle(context(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  describe('--tenant', () => {
    it('should run the rest of the pipeline inside the tenant, as the system actor', async () => {
      const seen: { tenant: string; legacy: string; system?: boolean }[] = [];

      await new TenantMiddleware([]).handle(
        context({ tenant: 'tenant-mw-a', allTenants: false }),
        async () => {
          seen.push({
            tenant: ExecutionContext.tenant.name,
            legacy: legacyTenants.current().name,
            system: ExecutionContext.actor?.isSystem(),
          });
        }
      );

      expect(seen).toEqual([{ tenant: 'tenant-mw-a', legacy: 'tenant-mw-a', system: true }]);
    });

    it('should fail with TenantNotFound, running nothing, for an unknown tenant', async () => {
      const next = jest.fn();

      await expect(
        new TenantMiddleware([]).handle(context({ tenant: 'nope', allTenants: false }), next)
      ).rejects.toThrow(TenantNotFound);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('--all-tenants', () => {
    it('should run the downstream middlewares once per tenant and collect their results', async () => {
      const seen: string[] = [];
      const ctx = context({ allTenants: true });
      const next = jest.fn();

      await new TenantMiddleware([recorder(seen)]).handle(ctx, next);

      expect(seen.filter(entry => NAMES.some(name => entry.startsWith(name)))).toEqual([
        'tenant-mw-a|tenant-mw-a',
        'tenant-mw-b|tenant-mw-b',
      ]);
      expect(next).not.toHaveBeenCalled();
      expect(
        (ctx.result as { results: { tenant: string }[] }).results.filter(r =>
          NAMES.includes(r.tenant)
        )
      ).toEqual([
        { tenant: 'tenant-mw-a', data: 'result of tenant-mw-a' },
        { tenant: 'tenant-mw-b', data: 'result of tenant-mw-b' },
      ]);
    });

    it('should report a failing tenant without stopping the others', async () => {
      const failingOnA: Middleware = {
        async handle(c) {
          if (ExecutionContext.tenant.name === 'tenant-mw-a') throw new TenantNotFound('inner');
          c.result = 'ok';
        },
      };
      const ctx = context({ allTenants: true });

      await new TenantMiddleware([failingOnA]).handle(ctx, jest.fn());

      const { results, errors } = ctx.result as {
        results: { tenant: string }[];
        errors: { tenant: string; error: { code: string } }[];
      };
      expect(results.filter(r => NAMES.includes(r.tenant))).toEqual([
        { tenant: 'tenant-mw-b', data: 'ok' },
      ]);
      expect(errors.filter(e => NAMES.includes(e.tenant))).toEqual([
        { tenant: 'tenant-mw-a', error: expect.objectContaining({ code: 'tenant.not_found' }) },
      ]);
    });
  });
});
