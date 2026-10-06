import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ActivityReaderFactory } from '../../infrastructure/factories/ActivityReaderFactory.js';

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

const TENANT = 'usage-activity';

type StoredSession = { sid: string; user?: string; lastActive: number };

const sessions: StoredSession[] = [
  { sid: 'older', user: `user1///${TENANT}`, lastActive: 1_700_000_000_000 },
  { sid: 'latest', user: `user2///${TENANT}`, lastActive: 1_700_000_500_000 },
  { sid: 'other-tenant', user: `user3///${TENANT}-2`, lastActive: 1_800_000_000_000 },
  { sid: 'prefixed-tenant', user: `user4///x${TENANT}`, lastActive: 1_800_000_000_000 },
  { sid: 'anonymous', lastActive: 1_900_000_000_000 },
];

const sessionPayload = ({ user }: StoredSession) => ({
  cookie: { originalMaxAge: null, httpOnly: true, path: '/' },
  ...(user ? { passport: { user } } : {}),
});

type SessionDocument = { _id: string; session: string; lastModified?: Date; expires: Date };

const sharedDb = () => DB.mongodb_Db(config.SHARED_DB);

/** Stored as connect-mongo stores them: the session serialized, touched at lastModified. */
const storeInMongo = async (stored: StoredSession[]) =>
  sharedDb()
    .collection<SessionDocument>('sessions')
    .insertMany(
      stored.map(session => ({
        _id: session.sid,
        session: JSON.stringify(sessionPayload(session)),
        lastModified: new Date(session.lastActive),
        expires: new Date(session.lastActive + TTL_MS),
      }))
    );

/** Stored as connect-pg-simple stores them: touching moves expire a full TTL ahead. */
const storeInPostgres = async (stored: StoredSession[]) =>
  Promise.all(
    stored.map(async session =>
      testingEnvironment.pg.pool!.query(
        'INSERT INTO http_sessions (sid, sess, expire) VALUES ($1, $2, $3)',
        [
          session.sid,
          JSON.stringify(sessionPayload(session)),
          new Date(session.lastActive + TTL_MS),
        ]
      )
    )
  );

describe('ActivityReader', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.pg.pool!.query('DELETE FROM http_sessions');
    await sharedDb().collection('sessions').deleteMany({});
  });

  describe.each([
    { backend: 'mongo' as const, store: storeInMongo },
    { backend: 'postgres' as const, store: storeInPostgres },
  ])('$backend', ({ backend, store }) => {
    const lastSession = async (tenantName: string) =>
      ActivityReaderFactory.default(backend).lastSession(tenantName);

    it("should report the tenant's latest session activity", async () => {
      await store(sessions);

      expect(await lastSession(TENANT)).toBe(1_700_000_500_000);
    });

    it('should report null when the tenant has no sessions', async () => {
      await store(sessions);

      expect(await lastSession('no-sessions')).toBeNull();
    });

    it('should match the tenant name literally', async () => {
      await store([{ sid: 'dotted', user: 'user5///a.b', lastActive: 1_700_000_000_000 }]);

      expect(await lastSession('a.b')).toBe(1_700_000_000_000);
      expect(await lastSession('axb')).toBeNull();
    });
  });

  describe('mongo sessions never touched', () => {
    it('should take the activity from the expiry when lastModified is missing', async () => {
      await sharedDb()
        .collection<SessionDocument>('sessions')
        .insertOne({
          _id: 'untouched',
          session: JSON.stringify(
            sessionPayload({ sid: 'untouched', user: `u///${TENANT}`, lastActive: 0 })
          ),
          expires: new Date(1_700_000_000_000 + TTL_MS),
        });

      expect(await ActivityReaderFactory.default('mongo').lastSession(TENANT)).toBe(
        1_700_000_000_000
      );
    });
  });
});
