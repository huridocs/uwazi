import { ExecutionContext, ExecutionContextDeps } from './ExecutionContext.js';
import { TransactionManagerFactory } from '../infrastructure/factories/TransactionManagerFactory.js';
import { isPostgresCoreActive } from './featureFlags.js';

type TransactionManagerFactories = Pick<
  ExecutionContextDeps['factories'],
  'transactionManager' | 'mongoTransactionManager' | 'postgresTransactionManager'
>;

/**
 * The transaction manager factories shared by every ExecutionContext builder.
 *
 * `transactionManager` is flag-aware: it resolves to the Postgres manager when
 * the tenant has postgresCore active, Mongo otherwise. The concrete accessors
 * (`mongoTransactionManager` / `postgresTransactionManager`) remain available
 * for data sources that are still Mongo-only or Postgres-only during the
 * migration.
 */
const transactionManagerFactories = (): TransactionManagerFactories => ({
  transactionManager: () =>
    isPostgresCoreActive()
      ? ExecutionContext.postgresTransactionManager
      : ExecutionContext.mongoTransactionManager,
  mongoTransactionManager: TransactionManagerFactory.mongo,
  postgresTransactionManager: TransactionManagerFactory.postgres,
});

export { transactionManagerFactories };
