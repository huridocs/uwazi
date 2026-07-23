import { ExecutionContext, ExecutionContextDeps } from '../ExecutionContext.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const buildContext = (): ExecutionContextDeps => ({
  tenant: {
    name: 'tenant-a',
    dbName: 'tenant-a',
    indexName: 'index',
    domain: '127.0.0.1',
  } as ExecutionContextDeps['tenant'],
  factories: {
    transactionManager: TransactionManagerFactory.default,
    postgresTransactionManager: PostgresTransactionManagerFactory.default,
    eventEmitter: EventEmitterFactory.forTesting,
    jobsDispatcher: (() => ({})) as unknown as ExecutionContextDeps['factories']['jobsDispatcher'],
    idGenerator: IdGeneratorFactory.default,
    logger: LoggerFactory.forTests,
    telemetryCollector: () => new TelemetryCollector('test'),
  },
});

beforeAll(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('ExecutionContext', () => {
  describe('postgresTransactionManager', () => {
    it('should build a PostgresTransactionManager from the wired factory', () => {
      ExecutionContext.run(buildContext(), () => {
        expect(ExecutionContext.postgresTransactionManager).toBeInstanceOf(
          PostgresTransactionManager
        );
      });
    });

    it('should memoize the instance within a single run', () => {
      ExecutionContext.run(buildContext(), () => {
        const first = ExecutionContext.postgresTransactionManager;
        const second = ExecutionContext.postgresTransactionManager;
        expect(first).toBe(second);
      });
    });

    it('should create a fresh instance across separate runs', () => {
      let fromFirstRun: unknown;
      let fromSecondRun: unknown;

      ExecutionContext.run(buildContext(), () => {
        fromFirstRun = ExecutionContext.postgresTransactionManager;
      });
      ExecutionContext.run(buildContext(), () => {
        fromSecondRun = ExecutionContext.postgresTransactionManager;
      });

      expect(fromFirstRun).not.toBe(fromSecondRun);
    });

    it('should be independent from the mongo transactionManager', () => {
      ExecutionContext.run(buildContext(), () => {
        expect(ExecutionContext.postgresTransactionManager).not.toBe(
          ExecutionContext.transactionManager
        );
      });
    });
  });

  describe('correlationId', () => {
    it('should be undefined outside a run()', () => {
      expect(ExecutionContext.correlationId).toBeUndefined();
    });

    it('should return the value passed into run()', () => {
      ExecutionContext.run({ ...buildContext(), correlationId: 'correlation-id-a' }, () => {
        expect(ExecutionContext.correlationId).toBe('correlation-id-a');
      });
    });

    it('should be undefined when not passed into run()', () => {
      ExecutionContext.run(buildContext(), () => {
        expect(ExecutionContext.correlationId).toBeUndefined();
      });
    });
  });
});
