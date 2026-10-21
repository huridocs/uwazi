import knex, { Knex } from 'knex';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import {
  PgDataMigration,
  PgGlobalDataMigration,
  PgTenantDataMigration,
} from '../PgDataMigration.js';
import { PgDataMigrationRunner } from '../PgDataMigrationRunner.js';
import { PgDataMigrationFailed } from '../PgDataMigrationFailed.js';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const TENANT_C = 'tenant-c';

const template = (tenantId: string, name: string) => ({
  _id: `${tenantId}-template`,
  name,
  tenant_id: tenantId,
});

const entity = (tenantId: string, title: string) => ({
  _id: `${tenantId}-entity`,
  sharedId: `${tenantId}-entity`,
  language: 'en',
  title,
  template: `${tenantId}-template`,
  published: false,
  creationDate: 1,
  editDate: 1,
  tenant_id: tenantId,
});

const tenantMigration = (
  up: PgTenantDataMigration['up'],
  reindex = false
): PgTenantDataMigration => ({ scope: 'tenant', description: 'test', reindex, up });

const globalMigration = (
  up: PgGlobalDataMigration['up'],
  reindex = false
): PgGlobalDataMigration => ({ scope: 'global', description: 'test', reindex, up });

describe('PgDataMigrationRunner', () => {
  let adminKnex: Knex;
  let tenants: string[];
  const heartbeat = jest.fn(async () => Promise.resolve());

  const createRunner = () =>
    new PgDataMigrationRunner({
      adminKnex,
      appKnex: PostgresDB.appMigrationKnex(),
      listTenants: () => tenants,
      logger: createMockLogger(),
    });

  const run = async (migration: PgDataMigration) =>
    createRunner().run(migration, { delta: 7, name: 'test-migration', heartbeat });

  const rows = async (table: string, columns: string[]) =>
    adminKnex(table)
      .select(['tenant_id', ...columns])
      .orderBy('tenant_id');

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    adminKnex = knex({ client: 'pg', connection: testingEnvironment.pg.config });
  });

  afterAll(async () => {
    await adminKnex.destroy();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    tenants = [TENANT_B, TENANT_A, TENANT_C];
    heartbeat.mockClear();
    await testingEnvironment.setFixtures(
      {},
      {
        templates: [
          template(TENANT_A, 'a-template'),
          template(TENANT_B, 'b-template'),
          template(TENANT_C, 'c-template'),
        ],
        entities: [entity(TENANT_A, 'a'), entity(TENANT_B, 'b'), entity(TENANT_C, 'c')],
      }
    );
  });

  describe('tenant scope', () => {
    it('should run once per tenant, in name order, seeing only that tenant rows', async () => {
      const seen: { tenantId: string; names: string[] }[] = [];

      await run(
        tenantMigration(async ctx => {
          const names = await ctx.transaction(async trx =>
            (await trx('templates').select('name')).map(row => row.name)
          );
          seen.push({ tenantId: ctx.tenantId, names });
        })
      );

      expect(seen).toEqual([
        { tenantId: TENANT_A, names: ['a-template'] },
        { tenantId: TENANT_B, names: ['b-template'] },
        { tenantId: TENANT_C, names: ['c-template'] },
      ]);
      expect(heartbeat).toHaveBeenCalledTimes(3);
    });

    it('should see and update unpublished entities, ignoring entity permissions', async () => {
      await run(
        tenantMigration(async ctx => {
          await ctx.transaction(async trx =>
            trx('entities').update({ title: `${ctx.tenantId} migrated` })
          );
        })
      );

      expect(await rows('entities', ['title'])).toEqual([
        { tenant_id: TENANT_A, title: `${TENANT_A} migrated` },
        { tenant_id: TENANT_B, title: `${TENANT_B} migrated` },
        { tenant_id: TENANT_C, title: `${TENANT_C} migrated` },
      ]);
    });

    it('should not leave the tenant set on the connection after the transaction', async () => {
      tenants = [TENANT_A];
      await run(tenantMigration(async ctx => ctx.transaction(async trx => trx.raw('SELECT 1'))));

      const after = await PostgresDB.appMigrationKnex().raw(
        "SELECT current_setting('app.current_tenant', true) AS tenant"
      );

      expect(after.rows[0].tenant ?? '').toBe('');
    });

    it('should keep committed transactions when a later one throws', async () => {
      tenants = [TENANT_A];

      await expect(
        run(
          tenantMigration(async ctx => {
            await ctx.transaction(async trx => trx('templates').update({ name: 'first' }));
            await ctx.transaction(async trx => {
              await trx('templates').update({ name: 'second' });
              throw new Error('boom');
            });
          })
        )
      ).rejects.toThrow(PgDataMigrationFailed);

      expect(await rows('templates', ['name'])).toEqual([
        { tenant_id: TENANT_A, name: 'first' },
        { tenant_id: TENANT_B, name: 'b-template' },
        { tenant_id: TENANT_C, name: 'c-template' },
      ]);
    });

    it('should run every tenant and report only the ones that failed', async () => {
      const result = run(
        tenantMigration(async ctx => {
          if (ctx.tenantId === TENANT_B) throw new Error('bad data in b');
          await ctx.transaction(async trx => trx('templates').update({ name: 'migrated' }));
        })
      );

      await expect(result).rejects.toThrow(PgDataMigrationFailed);
      await expect(result).rejects.toThrow(/tenant-b: bad data in b/);
      await expect(result).rejects.toMatchObject({ failedTenants: [TENANT_B] });
      expect(await rows('templates', ['name'])).toEqual([
        { tenant_id: TENANT_A, name: 'migrated' },
        { tenant_id: TENANT_B, name: 'b-template' },
        { tenant_id: TENANT_C, name: 'migrated' },
      ]);
    });

    it('should return the tenants that asked for a reindex', async () => {
      const { reindexTenants } = await run(
        tenantMigration(async ctx => {
          if (ctx.tenantId !== TENANT_B) ctx.reindex();
        }, true)
      );

      expect(reindexTenants).toEqual([TENANT_A, TENANT_C]);
    });

    it('should fail the tenant that asks for a reindex when the migration declares none', async () => {
      await expect(run(tenantMigration(async ctx => ctx.reindex()))).rejects.toThrow(
        /declares reindex: false/
      );
    });
  });

  describe('global scope', () => {
    it('should run once with the owner connection, across every tenant', async () => {
      const runs: string[][] = [];

      await run(
        globalMigration(async ctx => {
          runs.push(
            (await ctx.knex('templates').select('name').orderBy('name')).map(row => row.name)
          );
        })
      );

      expect(runs).toEqual([['a-template', 'b-template', 'c-template']]);
    });

    it('should return the tenants it reports for reindex', async () => {
      const { reindexTenants } = await run(
        globalMigration(async ctx => ctx.reindex([TENANT_A, TENANT_B]), true)
      );

      expect(reindexTenants).toEqual([TENANT_A, TENANT_B]);
    });

    it('should reject a reindex when the migration declares none', async () => {
      await expect(run(globalMigration(async ctx => ctx.reindex([TENANT_A])))).rejects.toThrow(
        /declares reindex: false/
      );
    });
  });

  it('should reject a migration that does not declare its scope', async () => {
    const unscoped = { description: 'test', reindex: false, up: async () => {} };

    await expect(run(unscoped as unknown as PgDataMigration)).rejects.toThrow(
      "Migration 7 (test-migration) must declare scope: 'tenant' or 'global'"
    );
  });
});
