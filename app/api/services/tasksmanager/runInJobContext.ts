import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';

const runInJobContext = async (tenantName: string, fn: () => Promise<void>): Promise<void> =>
  ExecutionContextFactory.runForTenant(tenantName, { telemetry: { kind: 'queue_job' } }, fn);

export { runInJobContext };
