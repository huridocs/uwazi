import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { SessionsLastOutputSchema } from '../../contracts.js';
import { SessionsLastController } from '../SessionsLastController.js';

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** The shared database is shared by every test worker: only touch the sessions this spec owns. */
const SID_PREFIX = 'cli-sessions-last-spec:';

type StoredSession = { sid: string; user: string; lastActive: number };

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

describe('SessionsLastController', () => {
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

  const lastSession = async () =>
    SessionsLastOutputSchema.strict().parse(
      await ControllerSpecs.asCli(async () => SessionsLastController.handle())
    );

  describe.each([
    { backend: 'mongo' as const, store: storeInMongo },
    { backend: 'postgres' as const, store: storeInPostgres },
  ])('$backend sessions', ({ backend, store }) => {
    beforeEach(() => {
      config.sessionsBackend = backend;
    });

    it("should report the tenant's latest session activity in the CLI output contract", async () => {
      const tenant = testingTenants.current().name;
      await store([
        { sid: 'older', user: `user1///${tenant}`, lastActive: 1_700_000_000_000 },
        { sid: 'latest', user: `user2///${tenant}`, lastActive: 1_700_000_500_000 },
      ]);

      expect(await lastSession()).toEqual({ lastSession: 1_700_000_500_000 });
    });

    it('should report 0, not null, when the tenant has no sessions', async () => {
      expect(await lastSession()).toEqual({ lastSession: 0 });
    });

    it("should ignore other tenants' sessions", async () => {
      const tenant = testingTenants.current().name;
      await store([
        { sid: 'other', user: `user3///${tenant}-2`, lastActive: 1_800_000_000_000 },
        { sid: 'prefixed', user: `user4///x${tenant}`, lastActive: 1_800_000_000_000 },
      ]);

      expect(await lastSession()).toEqual({ lastSession: 0 });
    });
  });
});
