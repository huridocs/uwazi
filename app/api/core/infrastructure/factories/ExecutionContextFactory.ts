import {
  ExecutionContext,
  ExecutionContextDeps,
  DependencyFactories,
} from '#api/core/libs/ExecutionContext.js';
import { transactionManagerFactories } from '#api/core/libs/transactionManagerFactories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import { User } from '#api/users.v2/model/User.js';
import { JobsDispatcherFactory } from './JobsDispatcherFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { LoggerFactory } from './LoggerFactory.js';

type TelemetryKind = 'http_request' | 'queue_job' | 'migration' | 'cli' | 'v1_bridge' | 'test';

type ExecutionContextOptions = {
  tenant?: Tenant;
  actor?: User;
  /** Not generated when omitted: only callers that already had one keep one. */
  correlationId?: string;
  telemetry: { kind: TelemetryKind; startPerfMs?: number };
  overrides?: Partial<DependencyFactories>;
};

/**
 * The single place that decides which implementations an ExecutionContext is wired with.
 *
 * Lives outside ExecutionContext on purpose: the default factories import ExecutionContext
 * themselves, so wiring them from inside it would create an import cycle.
 *
 * It never resolves an actor and never reuses an existing store — both stay with the caller.
 */
class ExecutionContextFactory {
  static defaultFactories({
    kind,
    startPerfMs,
  }: ExecutionContextOptions['telemetry']): DependencyFactories {
    return {
      ...transactionManagerFactories(),
      jobsDispatcher: JobsDispatcherFactory.default,
      eventEmitter: EventEmitterFactory.default,
      idGenerator: IdGeneratorFactory.default,
      logger: LoggerFactory.default,
      telemetryCollector: () => new TelemetryCollector(kind, startPerfMs),
    };
  }

  static build({
    tenant,
    actor,
    correlationId,
    telemetry,
    overrides,
  }: ExecutionContextOptions): ExecutionContextDeps {
    return {
      tenant,
      actor,
      correlationId,
      factories: { ...ExecutionContextFactory.defaultFactories(telemetry), ...overrides },
    };
  }

  static async run<R>(options: ExecutionContextOptions, fn: () => Promise<R>): Promise<R> {
    return ExecutionContext.run(ExecutionContextFactory.build(options), fn);
  }

  /** Also sets the legacy tenant context, which code outside core still reads. */
  static async runForTenant<R>(
    tenantName: string,
    options: Omit<ExecutionContextOptions, 'tenant'>,
    fn: () => Promise<R>
  ): Promise<R> {
    let result!: R;

    await tenants.run(async () => {
      result = await ExecutionContextFactory.run({ ...options, tenant: tenants.current() }, fn);
    }, tenantName);

    return result;
  }
}

export { ExecutionContextFactory };
export type { ExecutionContextOptions, TelemetryKind };
