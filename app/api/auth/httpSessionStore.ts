import connectPgSimple from 'connect-pg-simple';
import MongoStore from 'connect-mongo';
import session, { type SessionData, type Store } from 'express-session';
import { config, resolveSessionsBackend } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { DB } from '#api/odm/index.js';

const TTL_SECONDS = 14 * 24 * 60 * 60;
const TOUCH_AFTER_MS = 24 * 60 * 60 * 1000;

type SessionsBackend = ReturnType<typeof resolveSessionsBackend>;

type SessionWithTouch = SessionData & { lastModified?: Date };

type SessionRow = { sess?: SessionWithTouch | string; expire?: Date | string };

/**
 * `query` and `quotedTable` are real methods, marked private in connect-pg-simple
 * and absent from @types/connect-pg-simple. The touch window needs `expire`, which
 * the public `get` does not return.
 */
type QueryablePgStore = {
  query: (
    sql: string,
    params: unknown[],
    fn: (err: Error | null, row?: SessionRow) => void
  ) => void;
  quotedTable: () => string;
};

const PgStore = connectPgSimple(session);

const currentTimestamp = () => Math.ceil(Date.now() / 1000);

const parseSession = (sess: SessionWithTouch | string): SessionWithTouch =>
  typeof sess === 'string' ? (JSON.parse(sess) as SessionWithTouch) : sess;

const attachLastModified = (sess: SessionWithTouch, expire: Date | string): SessionWithTouch => ({
  ...sess,
  lastModified: new Date(new Date(expire).getTime() - TTL_SECONDS * 1000),
});

const withoutLastModified = ({
  lastModified: _lastModified,
  ...sess
}: SessionWithTouch): SessionData => sess;

class TouchLimitedPgStore extends PgStore {
  constructor() {
    super({
      pool: PostgresDB.pool(),
      tableName: 'http_sessions',
      createTableIfMissing: false,
      ttl: TTL_SECONDS,
      pruneSessionInterval: process.env.NODE_ENV === 'test' ? false : undefined,
    });
    if (process.env.NODE_ENV !== 'test') {
      this.pruneSessions();
    }
  }

  override get(sid: string, fn: (err: any, sess?: SessionData | null) => void): void {
    const store = this as unknown as QueryablePgStore;
    store.query(
      `SELECT sess, expire FROM ${store.quotedTable()} WHERE sid = $1 AND expire >= to_timestamp($2)`,
      [sid, currentTimestamp()],
      (err, row) => {
        if (err) {
          fn(err);
          return;
        }
        if (!row?.sess || row.expire === undefined) {
          fn(null, null);
          return;
        }
        try {
          fn(null, attachLastModified(parseSession(row.sess), row.expire));
        } catch (parseError) {
          this.destroy(sid, () => fn(parseError));
        }
      }
    );
  }

  override set(sid: string, sess: SessionWithTouch, fn?: (err?: any) => void): void {
    super.set(sid, withoutLastModified(sess), fn);
  }

  override touch(sid: string, sess: SessionWithTouch, fn?: () => void): void {
    const lastModified = sess.lastModified ? new Date(sess.lastModified).getTime() : 0;
    if (lastModified > 0 && Date.now() - lastModified < TOUCH_AFTER_MS) {
      fn?.();
      return;
    }
    super.touch(sid, sess, fn);
  }
}

const createMongoSessionStore = (): Store & { close: () => Promise<void> } => {
  const store = MongoStore.create({
    touchAfter: TOUCH_AFTER_MS / 1000,
    dbName: config.SHARED_DB,
    client: DB.connectionForDB(config.SHARED_DB, {
      useCache: true,
      noListener: false,
    }).getClient(),
  });
  return Object.assign(store, {
    close: async () => undefined,
  });
};

const createHttpSessionStore = (
  backend: SessionsBackend = config.sessionsBackend
): Store & { close: () => Promise<void> | void } =>
  backend === 'postgres' ? new TouchLimitedPgStore() : createMongoSessionStore();

export { createHttpSessionStore, resolveSessionsBackend };
export type { SessionsBackend };
