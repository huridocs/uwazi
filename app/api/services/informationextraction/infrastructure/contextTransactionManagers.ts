import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

/**
 * The transaction managers the IX factories hand to their data sources: the execution context's
 * own. Reading them outside a context throws, and some callers still construct IX data sources
 * without one, so a new manager is built only then — the fallback `EntitiesDAOFactory` uses.
 */
const mongoTransactionManager = () =>
  ExecutionContext.getStore()
    ? ExecutionContext.mongoTransactionManager
    : TransactionManagerFactory.mongo();

const postgresTransactionManager = () =>
  ExecutionContext.getStore()
    ? ExecutionContext.postgresTransactionManager
    : PostgresTransactionManagerFactory.default();

export { mongoTransactionManager, postgresTransactionManager };
