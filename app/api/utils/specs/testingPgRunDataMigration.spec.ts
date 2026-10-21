import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PgTenantDataMigration } from '#api/core/infrastructure/postgresql/PgDataMigration.js';

describe('testingEnvironment.pg.runDataMigration', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(
      {},
      {
        templates: [
          { _id: 'a', name: 'a', tenant_id: 'tenant-a' },
          { _id: 'b', name: 'b', tenant_id: 'tenant-b' },
        ],
      }
    );
  });

  it('should run a tenant migration like production, once per tenant under RLS', async () => {
    const migration: PgTenantDataMigration = {
      scope: 'tenant',
      description: 'test',
      reindex: true,
      async up(ctx) {
        await ctx.transaction(async trx => trx('templates').update({ name: ctx.tenantId }));
        if (ctx.tenantId === 'tenant-b') ctx.reindex();
      },
    };

    const { reindexed } = await testingEnvironment.pg.runDataMigration(migration, [
      'tenant-a',
      'tenant-b',
    ]);

    expect(reindexed).toEqual(['tenant-b']);
    expect(
      (await testingEnvironment.pg.getAllFrom<{ tenant_id: string; name: string }>('templates'))
        .map(({ tenant_id: tenantId, name }) => ({ tenantId, name }))
        .sort((a, b) => a.tenantId.localeCompare(b.tenantId))
    ).toEqual([
      { tenantId: 'tenant-a', name: 'tenant-a' },
      { tenantId: 'tenant-b', name: 'tenant-b' },
    ]);
  });
});
