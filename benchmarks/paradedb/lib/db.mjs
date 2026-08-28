import pg from 'pg';

const { Client } = pg;

const ADMIN = {
  host: process.env.PROBE_PGHOST ?? '127.0.0.1',
  port: Number(process.env.PROBE_PGPORT ?? 5433),
  user: 'admin',
  password: 'admin',
  database: 'paradedb_probe',
};

// Probes run as a non-superuser, non-owner role. Connecting as `admin` would
// bypass RLS entirely and turn every collaborator probe into an admin probe.
const APP = { ...ADMIN, user: 'probe_app', password: 'probe_app' };

const TENANT = 'tenant_a';

const connect = async (config = APP) => {
  const client = new Client(config);
  await client.connect();
  return client;
};

const connectAdmin = async () => connect(ADMIN);

/**
 * The two actors that matter. `admin` takes the bypass_rls branch of the read
 * policy; `collaborator` takes the array-overlap branch. Every performance
 * claim has to be made about the second one -- see tradeoffs §I.5.
 */
const ACTORS = {
  admin: { bypass: 'true', refIds: '' },
  collaborator: { bypass: 'false', refIds: 'collab1' },
};

const setActor = async (client, actor, tenant = TENANT) => {
  const { bypass, refIds } = ACTORS[actor];
  await client.query(`SET app.current_tenant = '${tenant}'`);
  await client.query(`SET uwazi.bypass_rls = '${bypass}'`);
  await client.query(`SET uwazi.ref_ids = '${refIds}'`);
};

export { connect, connectAdmin, setActor, ACTORS, TENANT, ADMIN, APP };
