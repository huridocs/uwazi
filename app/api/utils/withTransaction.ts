import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { storage } from 'api/files/storage';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
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
  const logger = LoggerFactory.default();
  const startTime = performance.now();
  const logNamespace = namespace ? `(${namespace})` : '';

  const transactionManager = TransactionManagerFactory.default();

  let wasManuallyAborted = false;
  try {
    return await transactionManager.run(async () => {
      dbSessionContext.setTransactionManager(transactionManager);
      const context: TransactionOperation = {
        abort: async () => {
          await transactionManager.abort();
          wasManuallyAborted = true;

          if (process.env.NODE_ENV !== 'test') {
            const elapsedTime = performance.now() - startTime;
            logger.info(
              `[v1_transactions] Transactions ${logNamespace} was manually aborted,` +
                ` session id -> ${inspect(transactionManager.getSession()?.id)} (${elapsedTime.toFixed(2)}ms)`
            );
          }
        },
      };
      try {
        return await operation(context);
      } finally {
        if (!wasManuallyAborted) {
          dbSessionContext.clearSession();
          await performDelayedFileStores();
        }
      }
    });
  } finally {
    if (!wasManuallyAborted) {
      await performDelayedReindexes();
    }
    dbSessionContext.clearContext();
  }
};

export { withTransaction };
