/* eslint-disable max-statements */
import { Db } from 'mongodb';
import { type SessionData } from 'express-session';
import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { createHttpSessionStore, resolveSessionsBackend } from '../httpSessionStore.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const TWENTY_FIVE_HOURS_MS = 25 * 60 * 60 * 1000;

const sessionData = (): SessionData =>
  ({
    cookie: {
      originalMaxAge: null,
      expires: false,
      httpOnly: true,
      path: '/',
    },
    passport: { user: 'abc///some-tenant' },
  }) as unknown as SessionData;

const finish = async <T>(
  run: (done: (err?: unknown, result?: T | null) => void) => void
): Promise<T | null | undefined> =>
  new Promise((resolve, reject) => {
    run((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });

describe('resolveSessionsBackend', () => {
  it('should default to mongo', () => {
    expect(resolveSessionsBackend(undefined)).toBe('mongo');
  });

  it.each(['mongo', 'postgres'] as const)('should accept %s', backend => {
    expect(resolveSessionsBackend(backend)).toBe(backend);
  });

  it('should reject an unknown backend', () => {
    expect(() => resolveSessionsBackend('redis')).toThrow(/SESSIONS_BACKEND/);
  });
});

describe('http session store', () => {
  let sharedDb: Db;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    sharedDb = DB.mongodb_Db(config.SHARED_DB);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.pg.pool?.query('DELETE FROM http_sessions');
    await sharedDb.collection('sessions').deleteMany({});
  });

  it('should keep the mongo store when the backend is mongo', async () => {
    const store = createHttpSessionStore('mongo');
    const sid = 'mongo-sid';

    await finish(done => store.set(sid, sessionData(), done));

    const stored = await sharedDb.collection<{ _id: string; session: string }>('sessions').findOne({
      _id: sid,
    });
    const pg = await testingEnvironment.pg.pool?.query('SELECT sid FROM http_sessions');

    expect(stored?.session).toContain('abc///some-tenant');
    expect(pg?.rows).toEqual([]);
  });

  describe('postgres', () => {
    const sid = 'pg-sid';

    const expireOf = async () => {
      const result = await testingEnvironment.pg.pool?.query(
        'SELECT expire, sess FROM http_sessions WHERE sid = $1',
        [sid]
      );
      return result?.rows[0] as { expire: Date; sess: { passport: { user: string } } };
    };

    it('should round-trip the session json, including the tenant in passport.user', async () => {
      const store = createHttpSessionStore('postgres');

      await finish(done => store.set(sid, sessionData(), done));
      const loaded = await finish(done => store.get(sid, done));
      const row = await expireOf();

      expect(loaded).toMatchObject({ passport: { user: 'abc///some-tenant' } });
      expect(row.sess).toEqual({
        cookie: sessionData().cookie,
        passport: { user: 'abc///some-tenant' },
      });
      expect(row.sess).not.toHaveProperty('lastModified');
      await store.close();
    });

    it('should not write when the session was touched within a day', async () => {
      const store = createHttpSessionStore('postgres');
      await finish(done => store.set(sid, sessionData(), done));
      const before = await expireOf();
      const loaded = await finish<SessionData>(done => store.get(sid, done));
      if (!loaded) {
        throw new Error('session was not stored');
      }

      await finish(done => store.touch!(sid, loaded, done));
      const after = await expireOf();

      expect(after.expire).toEqual(before.expire);
      await store.close();
    });

    it('should slide expiry once the session is a day old', async () => {
      const store = createHttpSessionStore('postgres');
      await finish(done => store.set(sid, sessionData(), done));
      await testingEnvironment.pg.pool?.query(
        'UPDATE http_sessions SET expire = $2 WHERE sid = $1',
        [sid, new Date(Date.now() + FOURTEEN_DAYS_MS - TWENTY_FIVE_HOURS_MS)]
      );
      const before = await expireOf();
      const loaded = await finish<SessionData>(done => store.get(sid, done));
      if (!loaded) {
        throw new Error('session was not stored');
      }

      await finish(done => store.touch!(sid, loaded, done));
      const after = await expireOf();

      expect(after.expire.getTime() - before.expire.getTime()).toBeGreaterThan(20 * 60 * 60 * 1000);
      await store.close();
    });

    it('should not return an expired session', async () => {
      const store = createHttpSessionStore('postgres');
      await finish(done => store.set(sid, sessionData(), done));
      await testingEnvironment.pg.pool?.query(
        'UPDATE http_sessions SET expire = $2 WHERE sid = $1',
        [sid, new Date(Date.now() - 60_000)]
      );

      expect(await finish(done => store.get(sid, done))).toBeFalsy();
      await store.close();
    });
  });
});
