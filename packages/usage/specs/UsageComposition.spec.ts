import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UsageComposition } from '../composition.js';

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

const TENANT = 'usage-composition';

/** The shared database is shared by every test worker: only touch the sessions this spec owns. */
const SID_PREFIX = 'usage-composition-spec:';

type StoredSession = { sid: string; user: string; lastActive: number };

const sessions: StoredSession[] = [
  { sid: 'older', user: `user1///${TENANT}`, lastActive: 1_700_000_000_000 },
  { sid: 'latest', user: `user2///${TENANT}`, lastActive: 1_700_000_500_000 },
  { sid: 'other-tenant', user: `user3///${TENANT}-2`, lastActive: 1_800_000_000_000 },
];

const sessionPayload = ({ user }: StoredSession) => ({
  cookie: { originalMaxAge: null, httpOnly: true, path: '/' },
  passport: { user },
});

type SessionDocument = { _id: string; session: string; lastModified?: Date; expires: Date };

const sharedDb = () => DB.mongodb_Db(config.SHARED_DB);

const storeInMongo = async (stored: StoredSession[]) =>
  sharedDb()
    .collection<SessionDocument>('sessions')
    .insertMany(
      stored.map(session => ({
        _id: `${SID_PREFIX}${session.sid}`,
        session: JSON.stringify(sessionPayload(session)),
        lastModified: new Date(session.lastActive),
        expires: new Date(session.lastActive + TTL_MS),
      }))
    );

const storeInPostgres = async (stored: StoredSession[]) =>
  Promise.all(
    stored.map(async session =>
      testingEnvironment.pg.pool!.query(
        'INSERT INTO http_sessions (sid, sess, expire) VALUES ($1, $2, to_timestamp($3))',
        [session.sid, JSON.stringify(sessionPayload(session)), (session.lastActive + TTL_MS) / 1000]
      )
    )
  );

describe('UsageComposition.lastSessionForCurrentTenant', () => {
  const previousBackend = config.sessionsBackend;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    config.sessionsBackend = previousBackend;
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.pg.pool!.query('DELETE FROM http_sessions');
    await sharedDb()
      .collection<SessionDocument>('sessions')
      .deleteMany({ _id: { $regex: `^${SID_PREFIX}` } });
  });

  const lastSessionOf = async (tenantName: string) => {
    const tenant = {
      ...testingTenants.createTenant({ name: tenantName, dbName: tenantName, indexName: 'index' }),
      domain: '127.0.0.1',
    };

    return testingEnvironment.runWithContext(
      async () => UsageComposition.lastSessionForCurrentTenant(),
      { tenant }
    );
  };

  describe.each([
    { backend: 'mongo' as const, store: storeInMongo },
    { backend: 'postgres' as const, store: storeInPostgres },
  ])('$backend', ({ backend, store }) => {
    beforeEach(async () => {
      config.sessionsBackend = backend;
      await store(sessions);
    });

    it("should report the current tenant's latest session activity", async () => {
      expect(await lastSessionOf(TENANT)).toBe(1_700_000_500_000);
    });

    it('should report null when the current tenant has no sessions', async () => {
      expect(await lastSessionOf('no-sessions')).toBeNull();
    });
  });
});
