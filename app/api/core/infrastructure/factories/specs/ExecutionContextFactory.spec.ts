import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import { User } from '#api/users.v2/model/User.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ExecutionContextFactory } from '../ExecutionContextFactory.js';

const tenant = testingTenants.createTenant({
  name: 'execution-context-factory-tenant',
  dbName: 'execution-context-factory-tenant',
  domain: 'tenant.test',
}) as Tenant;

const fakeIdGenerator: IdGenerator = { generate: () => 'fixed-id' };

describe('ExecutionContextFactory', () => {
  beforeAll(() => {
    tenants.add(tenant);
  });

  describe('build()', () => {
    it('should wire every dependency factory by default', () => {
      const context = ExecutionContextFactory.build({ telemetry: { kind: 'cli' } });

      expect(Object.keys(context.factories).sort()).toEqual(
        [
          'eventEmitter',
          'idGenerator',
          'jobsDispatcher',
          'logger',
          'mongoTransactionManager',
          'postgresTransactionManager',
          'telemetryCollector',
          'transactionManager',
        ].sort()
      );
    });

    it('should carry tenant, actor and correlationId into the context', () => {
      const actor = User.system();

      const context = ExecutionContextFactory.build({
        tenant,
        actor,
        correlationId: 'correlation-1',
        telemetry: { kind: 'cli' },
      });

      expect(context).toMatchObject({ tenant, actor, correlationId: 'correlation-1' });
    });

    it('should not generate a correlationId when none is given', () => {
      const context = ExecutionContextFactory.build({ telemetry: { kind: 'cli' } });

      expect(context.correlationId).toBeUndefined();
    });

    it('should let overrides replace default factories', () => {
      const idGenerator = () => fakeIdGenerator;

      const context = ExecutionContextFactory.build({
        telemetry: { kind: 'cli' },
        overrides: { idGenerator },
      });

      expect(context.factories.idGenerator).toBe(idGenerator);
    });

    it('should build the telemetry collector for the given kind', () => {
      const context = ExecutionContextFactory.build({
        telemetry: { kind: 'queue_job' },
      });

      expect(context.factories.telemetryCollector()).toBeInstanceOf(TelemetryCollector);
    });
  });

  describe('run()', () => {
    it('should run the callback inside the built context and return its result', async () => {
      const actor = User.system();

      const result = await ExecutionContextFactory.run(
        {
          tenant,
          actor,
          telemetry: { kind: 'cli' },
          overrides: { idGenerator: () => fakeIdGenerator },
        },
        async () => ({
          tenant: ExecutionContext.tenant,
          actor: ExecutionContext.actor,
          id: ExecutionContext.idGenerator.generate(),
        })
      );

      expect(result).toEqual({ tenant, actor, id: 'fixed-id' });
    });
  });

  describe('runForTenant()', () => {
    it('should set both the legacy tenant context and the ExecutionContext tenant', async () => {
      const result = await ExecutionContextFactory.runForTenant(
        tenant.name,
        { telemetry: { kind: 'cli' } },
        async () => ({
          legacy: tenants.current().name,
          context: ExecutionContext.tenant.name,
        })
      );

      expect(result).toEqual({ legacy: tenant.name, context: tenant.name });
    });

    it('should pass actor and overrides through', async () => {
      const actor = User.system();

      const result = await ExecutionContextFactory.runForTenant(
        tenant.name,
        { actor, telemetry: { kind: 'cli' }, overrides: { idGenerator: () => fakeIdGenerator } },
        async () => ({ actor: ExecutionContext.actor, id: ExecutionContext.idGenerator.generate() })
      );

      expect(result).toEqual({ actor, id: 'fixed-id' });
    });
  });
});
