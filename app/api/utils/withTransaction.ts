import { performance } from 'perf_hooks';
import { storage } from 'api/files/storage';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { inspect } from 'util';

interface TransactionOperation {
  abort: () => Promise<void>;
}

const originalIndexEntities = search.indexEntities.bind(search);
search.indexEntities = async (query, select, limit) => {
  if (dbSessionContext.getSession()) {
    return dbSessionContext.registerESIndexOperation([query, select, limit]);
  }
  return originalIndexEntities(query, select, limit);
};

const originalStoreFile = storage.storeFile.bind(storage);
storage.storeFile = async (filename, file, type) => {
  if (dbSessionContext.getSession()) {
    return dbSessionContext.registerFileOperation({ filename, file, type });
  }
  return originalStoreFile(filename, file, type);
};

const performDelayedFileStores = async () => {
  await storage.storeMultipleFiles(dbSessionContext.getFileOperations());
};

const performDelayedReindexes = async () => {
  await Promise.all(
    dbSessionContext
      .getReindexOperations()
      .map(async reindexArgs => originalIndexEntities(...reindexArgs))
  );
};

const withTransaction = async <T>(
  operation: (context: TransactionOperation) => Promise<T>,
  namespace?: string
): Promise<T> => {
  if (!tenants.current().featureFlags?.v1_transactions) {
    return operation({ abort: async () => {} });
  }

  const logger = DefaultLogger();
  const startTime = performance.now();
  const logNamespace = namespace ? `(${namespace})` : '';

  const session = await dbSessionContext.startSession();
  session.startTransaction();
  let wasManuallyAborted = false;

  const context: TransactionOperation = {
    abort: async () => {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      wasManuallyAborted = true;
      const elapsedTime = performance.now() - startTime;
      logger.info(
        `[v1_transactions] Transactions ${logNamespace} was manually aborted,` +
          ` session id -> ${inspect(session.id)} (${elapsedTime.toFixed(2)}ms)`
      );
    },
  };

  try {
    const result = await operation(context);
    const operationTime = performance.now() - startTime;
    logger.info(
      `[v1_transactions] Transaction ${logNamespace} operations was successfully completed,` +
        ` session id -> ${inspect(session.id)} (${operationTime.toFixed(2)}ms)`
    );

    if (!wasManuallyAborted) {
      dbSessionContext.clearSession();
      const beforeFileStores = performance.now();
      await performDelayedFileStores();
      const fileStoresTime = performance.now() - beforeFileStores;
      logger.info(
        `[v1_transactions] Transaction ${logNamespace} saved all files before session commit,` +
          ` session id -> ${inspect(session.id)} (${fileStoresTime.toFixed(2)}ms)`
      );

      const beforeCommit = performance.now();
      await session.commitTransaction();
      const commitTime = performance.now() - beforeCommit;
      logger.info(
        `[v1_transactions] Transaction ${logNamespace} session was commited,` +
          ` session id -> ${inspect(session.id)} (${commitTime.toFixed(2)}ms)`
      );

      const beforeReindex = performance.now();
      await performDelayedReindexes();
      const reindexTime = performance.now() - beforeReindex;
      logger.info(
        `[v1_transactions] Transaction ${logNamespace} elasticsearch reindexes after session was commited,` +
          ` session id -> ${inspect(session.id)} (${reindexTime.toFixed(2)}ms)`
      );
    }
    return result;
  } catch (e) {
    if (!wasManuallyAborted) {
      const errorTime = performance.now() - startTime;
      logger.info(
        `[v1_transactions] Transaction ${logNamespace} aborted due to error: ${inspect(e)},` +
          ` session id -> ${inspect(session.id)} (${errorTime.toFixed(2)}ms)`
      );
      await session.abortTransaction();
    }
    throw e;
  } finally {
    const beforeClearContext = performance.now();
    dbSessionContext.clearContext();
    const clearTime = performance.now() - beforeClearContext;
    logger.info(
      `[v1_transactions] Transaction ${logNamespace} cleared all context info,` +
        ` session id -> ${inspect(session.id)} (${clearTime.toFixed(2)}ms)`
    );
    const beforeClearSession = performance.now();
    await session.endSession();
    const endSessionTime = performance.now() - beforeClearSession;
    logger.info(
      `[v1_transactions] Transaction ${logNamespace} session ended,` +
        ` session id -> ${inspect(session.id)} (${endSessionTime.toFixed(2)}ms)`
    );
  }
};

export { withTransaction };
