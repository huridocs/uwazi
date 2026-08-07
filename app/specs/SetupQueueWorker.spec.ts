/* eslint-disable max-statements */
import { register } from 'app/setupQueueWorker';
import { ObjectId } from 'mongodb';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { QueueWorker } from '#api/core/libs/queue/infrastructure/QueueWorker.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { UserSchema } from '#shared/types/userType.js';
import { tenants } from '#api/tenants/index.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import users from '#api/users/users.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const TENANT = 'test-namespace';

const actor: UserSchema = {
  _id: new ObjectId().toString(),
  email: 'actor@email.com',
  role: 'admin',
  username: 'actor',
};

@PrivilegedJob()
class TestSystemJob extends UwaziJobHandler<{ userId: string }> {
  capturedTenant: Tenant | undefined;
  capturedTenant2: Tenant | undefined;
  capturedActor: UserSchema | undefined;

  protected async handle(
    _: HeartbeatCallback,
    _params: { userId: string },
    __?: JobInfo
  ): Promise<void> {
    this.capturedTenant = tenants.current();
    this.capturedTenant2 = ExecutionContext.tenant;
    this.capturedActor = ExecutionContext.actor as UserSchema | undefined;
  }
}

class TestPlainDispatchable implements Dispatchable {
  capturedActor: UserSchema | undefined;

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params: Params,
    _jobInfo?: JobInfo
  ): Promise<void> {
    this.capturedActor = ExecutionContext.actor as UserSchema | undefined;
  }
}

@PrivilegedJob()
class TestSystemPlainDispatchable implements Dispatchable {
  capturedActor: UserSchema | undefined;

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params: Params,
    _jobInfo?: JobInfo
  ): Promise<void> {
    this.capturedActor = ExecutionContext.actor as UserSchema | undefined;
  }
}

class TestUserJob extends UwaziJobHandler<{ userId: string; someParam: string }> {
  capturedTenant: Tenant | undefined;
  capturedTenant2: Tenant | undefined;
  capturedActor: UserSchema | undefined;

  protected async handle(
    _: HeartbeatCallback,
    _params: { userId: string; someParam: string },
    __?: JobInfo
  ): Promise<void> {
    this.capturedTenant = tenants.current();
    this.capturedTenant2 = ExecutionContext.tenant;
    this.capturedActor = ExecutionContext.actor as UserSchema | undefined;
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

  it('should set system actor for @SystemJob() plain Dispatchable jobs', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestSystemPlainDispatchable();
    register.call(worker, TestSystemPlainDispatchable, async () => testJob);

    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];
    const job = {
      namespace: TENANT,
      params: {},
    };

    const instance = await wrappedFactory(TENANT, job);
    const heartbeat: HeartbeatCallback = jest.fn();
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: TENANT };
    await instance.handleDispatch(heartbeat, job.params, jobInfo);

    expect(testJob.capturedActor).toMatchObject({ _id: '__system__', role: 'admin' });
  });

  it('should throw for plain Dispatchable without @SystemJob() and without userId', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestPlainDispatchable();
    register.call(worker, TestPlainDispatchable, async () => testJob);

    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];
    const job = {
      namespace: TENANT,
      params: {},
    };

    await expect(wrappedFactory(TENANT, job)).rejects.toThrow(
      'Missing userId: UwaziJobHandler jobs must use UwaziDispatcherFactory. Plain jobs must use @SystemJob().'
    );
  });

  it('should throw for UwaziJobHandler without userId', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestUserJob();
    register.call(worker, TestUserJob, async () => testJob);

    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];
    const job = {
      namespace: TENANT,
      params: { someParam: 'test-value' },
    };

    await expect(wrappedFactory(TENANT, job)).rejects.toThrow(
      'Missing userId: UwaziJobHandler jobs must use UwaziDispatcherFactory. Plain jobs must use @SystemJob().'
    );
  });

  it('should set system actor for @SystemJob() UwaziJobHandler jobs', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestSystemJob();
    register.call(worker, TestSystemJob, async () => testJob);

    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];
    const job = {
      namespace: TENANT,
      params: { userId: actor._id?.toString() },
    };

    const instance = await wrappedFactory(TENANT, job);
    const heartbeat: HeartbeatCallback = jest.fn();
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: TENANT };
    await instance.handleDispatch(heartbeat, job.params, jobInfo);

    expect(testJob.capturedTenant).toMatchObject({ name: TENANT });
    expect(testJob.capturedTenant2).toMatchObject({ name: TENANT });
    expect(testJob.capturedActor).toMatchObject({ _id: '__system__', role: 'admin' });
  });

  it('should set user actor for non-system jobs', async () => {
    const worker = TestUtils.mockClass<QueueWorker>({
      register: jest.fn(),
      getRegisteredJobs: jest.fn().mockReturnValue([]),
      start: jest.fn(),
      stop: jest.fn(),
    });

    const testJob = new TestUserJob();
    register.call(worker, TestUserJob, async () => testJob);

    const [, wrappedFactory] = (worker.register as jest.Mock).mock.calls[0];
    const job = {
      namespace: TENANT,
      params: { userId: actor._id?.toString(), someParam: 'test-value' },
    };

    const instance = await wrappedFactory(TENANT, job);
    const heartbeat: HeartbeatCallback = jest.fn();
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: TENANT };
    await instance.handleDispatch(heartbeat, job.params, jobInfo);

    expect(testJob.capturedTenant).toMatchObject({ name: TENANT });
    expect(testJob.capturedTenant2).toMatchObject({ name: TENANT });
    expect(testJob.capturedActor).toMatchObject({ _id: actor._id?.toString() });
  });
});
