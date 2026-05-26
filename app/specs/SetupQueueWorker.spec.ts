/* eslint-disable max-statements */
import { register } from 'app/setupQueueWorker';
import { ObjectId } from 'mongodb';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UserAwareDispatchable } from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { QueueWorker } from '#api/core/libs/queue/infrastructure/QueueWorker.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { UserSchema } from '#shared/types/userType.js';
import { tenants } from '#api/tenants/index.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import users from '#api/users/users.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const TENANT = 'test-namespace';

const actor: UserSchema = {
  _id: new ObjectId().toString(),
  email: 'actor@email.com',
  role: 'admin',
  username: 'actor',
};

type TestParams = { someParam: string };

class TestJob extends UserAwareDispatchable<TestParams> {
  capturedTenant: Tenant | undefined;

  capturedTenant2: Tenant | undefined;

  capturedUser: UserSchema | undefined;

  capturedUser2: UserSchema | undefined;

  capturedParams: unknown;

  protected async handle(_: HeartbeatCallback, __: JobInfo): Promise<void> {
    this.capturedTenant = tenants.current();
    this.capturedTenant2 = ExecutionContext.tenant;

    this.capturedUser = permissionsContext.getUserInContext() as UserSchema | undefined;
    this.capturedUser2 = ExecutionContext.actor as UserSchema | undefined;

    this.capturedParams = this.params;
  }
}

describe('Setup Queue Worker', () => {
  beforeEach(() => {
    tenants.add(testingTenants.createTenant({ name: TENANT }));
    jest.spyOn(users, 'getById').mockResolvedValue(actor as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correctly setup all contexts required for a Job to be executed', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestJob();

    register.call(worker, TestJob, async () => testJob);

    // Capture the wrapped factory that register() passed to worker.register
    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];

    const job = {
      namespace: TENANT,
      params: {
        userId: actor._id?.toString(),
        tenantName: TENANT,
        someParam: 'test-value',
      },
    };

    // Simulate QueueWorker creating the Dispatchable instance via the factory
    const instance = await wrappedFactory(TENANT, job);

    // Simulate QueueWorker invoking the job
    const heartbeat: HeartbeatCallback = jest.fn();
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: TENANT };
    await instance.handleDispatch(heartbeat, job.params, jobInfo);

    expect(testJob.capturedTenant).toMatchObject({ name: TENANT });
    expect(testJob.capturedTenant2).toMatchObject({ name: TENANT });

    expect(testJob.capturedUser).toMatchObject({ _id: actor._id?.toString(), email: actor.email });
    expect(testJob.capturedUser2).toMatchObject({ _id: actor._id?.toString() });

    expect(testJob.capturedParams).toMatchObject({
      someParam: 'test-value',
      userId: actor._id?.toString(),
      tenantName: TENANT,
    });
  });
});
