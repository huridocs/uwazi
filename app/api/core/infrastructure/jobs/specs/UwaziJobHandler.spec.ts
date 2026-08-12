import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { UserRole } from '#api/core/domain/user/User.js';

const f = getFixturesFactory();

const testUser = f.user({ username: 'testuser', role: UserRole.ADMIN });

const fixtures = {
  users: [testUser],
};

class TestUserJob extends UwaziJobHandler<{ userId: string; data: string }> {
  capturedParams: any;

  protected async handle(_heartbeat: HeartbeatCallback, params: { userId: string; data: string }) {
    this.capturedParams = params;
  }
}

@PrivilegedJob()
class TestPrivilegedJob extends UwaziJobHandler<{ userId: string; data: string }> {
  protected async handle(
    _heartbeat: HeartbeatCallback,
    _params: { userId: string; data: string }
  ) {}
}

describe('UwaziJobHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should set the user in v1 permissions context before calling handle', async () => {
    const setUserSpy = jest.spyOn(permissionsContext, 'setUserInContext');
    const setCommandSpy = jest.spyOn(permissionsContext, 'setCommandContext');
    const job = new TestUserJob();
    const heartbeat: HeartbeatCallback = jest.fn();
    const userId = testUser._id.toString();
    const params = { userId, data: 'test' };
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: tenants.current().name };

    await job.handleDispatch(heartbeat, params, jobInfo);

    expect(setUserSpy).toHaveBeenCalledTimes(1);
    expect(setUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        role: 'admin',
      })
    );
    expect(setCommandSpy).not.toHaveBeenCalled();
    expect(job.capturedParams).toEqual(params);

    setUserSpy.mockRestore();
    setCommandSpy.mockRestore();
  });

  it('should set command context for privileged jobs without fetching user', async () => {
    const setUserSpy = jest.spyOn(permissionsContext, 'setUserInContext');
    const setCommandSpy = jest.spyOn(permissionsContext, 'setCommandContext');
    const job = new TestPrivilegedJob();
    const heartbeat: HeartbeatCallback = jest.fn();
    const userId = testUser._id.toString();
    const params = { userId, data: 'test' };
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: tenants.current().name };

    await job.handleDispatch(heartbeat, params, jobInfo);

    expect(setCommandSpy).toHaveBeenCalledTimes(1);
    expect(setUserSpy).not.toHaveBeenCalled();

    setUserSpy.mockRestore();
    setCommandSpy.mockRestore();
  });

  it('should throw when user is not found for non-privileged jobs', async () => {
    const job = new TestUserJob();
    const heartbeat: HeartbeatCallback = jest.fn();
    const userId = new ObjectId().toString();
    const params = { userId, data: 'test' };
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: tenants.current().name };

    await expect(job.handleDispatch(heartbeat, params, jobInfo)).rejects.toThrow(
      `User not found: ${userId}`
    );
  });

  it('should throw when userId is missing for non-privileged jobs', async () => {
    const job = new TestUserJob();
    const heartbeat: HeartbeatCallback = jest.fn();
    const params = { userId: '', data: 'test' };
    const jobInfo: JobInfo = { retryCount: 0, maxRetries: 3, namespace: tenants.current().name };

    await expect(job.handleDispatch(heartbeat, params, jobInfo)).rejects.toThrow(
      'Missing userId: user-scoped jobs must include a userId parameter.'
    );
  });
});
