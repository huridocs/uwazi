import { Db } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { copyHttpSessions } from '../copyHttpSessions.js';

type MongoHttpSession = {
  _id: string;
  session: string;
  expires: Date;
  lastModified: Date;
};

const sessionDocument = (sid: string, tenant: string, expires: Date): MongoHttpSession => ({
  _id: sid,
  session: JSON.stringify({
    cookie: { expires: false, httpOnly: true, path: '/' },
    passport: { user: `user-1///${tenant}` },
  }),
  expires,
  lastModified: new Date('2026-01-01T00:00:00.000Z'),
});

describe('copyHttpSessions', () => {
  let mongo: Db;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: [] });
    if (!testingDB.mongodb) throw new Error('Testing mongodb not connected');
    mongo = testingDB.mongodb;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await mongo.collection<MongoHttpSession>('sessions').deleteMany({});
    await testingEnvironment.pg.pool?.query('DELETE FROM http_sessions');
  });

  const rows = async () => {
    const result = await testingEnvironment.pg.pool?.query(
      'SELECT sid, sess, expire FROM http_sessions ORDER BY sid'
    );
    return result?.rows ?? [];
  };

  it('should copy shared session documents without adding a tenant column', async () => {
    const expires = new Date('2030-06-01T00:00:00.000Z');
    await mongo
      .collection<MongoHttpSession>('sessions')
      .insertMany([
        sessionDocument('sid-a', 'tenant-a', expires),
        sessionDocument('sid-b', 'tenant-b', expires),
      ]);

    const result = await copyHttpSessions(mongo);

    expect(result).toEqual({ copied: 2, alreadyPresent: 0 });
    const stored = await rows();
    expect(stored.map(row => row.sid)).toEqual(['sid-a', 'sid-b']);
    expect(stored[0].sess).toEqual({
      cookie: { expires: false, httpOnly: true, path: '/' },
      passport: { user: 'user-1///tenant-a' },
    });
    expect(stored[0].sess).not.toHaveProperty('lastModified');
    expect(stored[0].expire).toEqual(expires);
    expect(stored[1].sess.passport.user).toBe('user-1///tenant-b');
  });

  it('should leave a session that postgres already has and copy only the missing one', async () => {
    const expires = new Date('2030-06-01T00:00:00.000Z');
    await mongo
      .collection<MongoHttpSession>('sessions')
      .insertMany([
        sessionDocument('sid-a', 'tenant-a', expires),
        sessionDocument('sid-b', 'tenant-b', expires),
      ]);
    await copyHttpSessions(mongo);
    await testingEnvironment.pg.pool?.query(
      `UPDATE http_sessions SET sess = '{"passport":{"user":"kept///tenant-a"}}' WHERE sid = 'sid-a'`
    );
    await mongo
      .collection<MongoHttpSession>('sessions')
      .insertOne(sessionDocument('sid-c', 'tenant-c', expires));

    const result = await copyHttpSessions(mongo);
    const stored = await rows();

    expect(result).toEqual({ copied: 1, alreadyPresent: 2 });
    expect(stored.find(row => row.sid === 'sid-a')?.sess).toEqual({
      passport: { user: 'kept///tenant-a' },
    });
    expect(stored.map(row => row.sid)).toEqual(['sid-a', 'sid-b', 'sid-c']);
  });
});
