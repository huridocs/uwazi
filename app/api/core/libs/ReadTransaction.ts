import { ExecutionContext } from './ExecutionContext.js';

/**
 * Runs the decorated method in one read only unit of work (`TransactionManager.runReadOnly`): on
 * Postgres every query inside it joins a single transaction instead of opening its own.
 *
 * Put it on the method that fans out into several queries. Everything the method awaits holds
 * the connection, so never on one that streams a response or waits on slow non-database work.
 */
export function ReadTransaction() {
  return function decorate(_target: object, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function inReadTransaction(...args: unknown[]) {
      return ExecutionContext.transactionManager.runReadOnly(async () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
