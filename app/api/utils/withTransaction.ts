import { storage } from 'api/files/storage';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { search } from 'api/search';
import { performance } from 'perf_hooks';
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

      if (process.env.NODE_ENV !== 'test') {
        const elapsedTime = performance.now() - startTime;
        logger.info(
          `[v1_transactions] Transactions ${logNamespace} was manually aborted,` +
            ` session id -> ${inspect(session.id)} (${elapsedTime.toFixed(2)}ms)`
        );
      }
    },
  };

  try {
    const result = await operation(context);

    if (!wasManuallyAborted) {
      dbSessionContext.clearSession();
      await performDelayedFileStores();
      await session.commitTransaction();
      await performDelayedReindexes();
    }
    return result;
  } catch (e) {
    if (!wasManuallyAborted) {
      if (process.env.NODE_ENV !== 'test') {
        const errorTime = performance.now() - startTime;
        logger.info(
          `[v1_transactions] Transaction ${logNamespace} aborted due to error: ${inspect(e)},` +
            ` session id -> ${inspect(session.id)} (${errorTime.toFixed(2)}ms)`
        );
      }
      await session.abortTransaction();
    }
    throw e;
  } finally {
    dbSessionContext.clearContext();
    await session.endSession();
  }
};

export { withTransaction };
