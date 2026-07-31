/**
 * Audit: find case-insensitive name collisions in Mongo `relationtypes` per tenant.
 *
 * Usage:
 *   node scripts/runner.js scripts/scripts.v2/auditRelationshipTypeNameCollisions.ts
 *   node scripts/runner.js scripts/scripts.v2/auditRelationshipTypeNameCollisions.ts --tenant <name>
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';

type CollisionGroup = {
  normalizedName: string;
  count: number;
  names: string[];
  ids: string[];
};

type TenantAuditResult = {
  tenant: string;
  hasCollection: boolean;
  groups: CollisionGroup[];
};

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

function logError(message: string) {
  process.stderr.write(`${message}\n`);
}

const argv = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Optional tenant to audit (defaults to all tenants)',
  })
  .strict()
  .parseSync();

async function auditTenant(tenantName: string): Promise<TenantAuditResult> {
  let result: TenantAuditResult = { tenant: tenantName, hasCollection: false, groups: [] };

  await tenants.run(async () => {
    const tenantConfig = tenants.current();
    const mongoDb = DB.mongodb_Db(tenantConfig.dbName);
    const collections = await mongoDb.listCollections({ name: 'relationtypes' }).toArray();
    if (collections.length === 0) {
      return;
    }

    const groups = await mongoDb
      .collection('relationtypes')
      .aggregate<{
        _id: string;
        count: number;
        names: string[];
        ids: { toString(): string }[];
      }>([
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$name' } } },
            count: { $sum: 1 },
            names: { $addToSet: '$name' },
            ids: { $push: '$_id' },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    result = {
      tenant: tenantName,
      hasCollection: true,
      groups: groups.map(group => ({
        normalizedName: group._id,
        count: group.count,
        names: group.names,
        ids: group.ids.map(id => id.toString()),
      })),
    };
  }, tenantName);

  return result;
}

function summarize(results: TenantAuditResult[], scannedTenants: number) {
  const tenantsWithRelationtypes = results.filter(result => result.hasCollection).length;
  const collisions = results
    .filter(result => result.groups.length > 0)
    .map(({ tenant, groups }) => ({ tenant, groups }));

  return {
    scannedTenants,
    tenantsWithRelationtypes,
    tenantsWithCollisions: collisions.length,
    collisions,
  };
}

async function cleanup(): Promise<void> {
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
}

function resolveTenantNames(): string[] {
  if (!argv.tenant) {
    return Object.keys(tenants.tenants);
  }
  if (!tenants.tenants[argv.tenant]) {
    logError(`Unknown tenant: ${argv.tenant}`);
    logError(`Available tenants: ${Object.keys(tenants.tenants).join(', ')}`);
    process.exit(1);
  }
  return [argv.tenant];
}

async function auditTenants(tenantNames: string[]): Promise<TenantAuditResult[]> {
  const results: TenantAuditResult[] = [];
  for (const tenantName of tenantNames) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await auditTenant(tenantName));
  }
  return results;
}

async function run(): Promise<void> {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();

  const tenantNames = resolveTenantNames();
  const results = await auditTenants(tenantNames);

  log('=== RELATIONSHIP TYPE NAME COLLISION AUDIT ===');
  log(JSON.stringify(summarize(results, tenantNames.length), null, 2));
  await cleanup();
}

run().catch(async error => {
  logError(`Audit failed: ${error}`);
  await cleanup();
  process.exit(1);
});
