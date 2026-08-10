import { tenants } from '#api/tenants/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { isPrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { getUserById } from '#api/core/infrastructure/jobs/getUserById.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';

export type UwaziJobParams = {
  userId: string;
};

export abstract class UwaziJobHandler<
  ExtendedParams extends UwaziJobParams = UwaziJobParams,
> implements Dispatchable {
  async handleDispatch(
    heartbeat: HeartbeatCallback,
    params: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    const extendedParams = params as ExtendedParams;
    const tenantName = jobInfo?.namespace;

    const runHandle = async () => {
      await this.setContext(extendedParams.userId);
      await this.handle(heartbeat, extendedParams, jobInfo);
    };

    if (tenantName) {
      await tenants.run(runHandle, tenantName);
    } else {
      await runHandle();
    }
  }

  private async setContext(userId: string) {
    if (isPrivilegedJob(this.constructor)) {
      permissionsContext.setCommandContext();
      return;
    }

    if (!userId) {
      throw new Error('Missing userId: user-scoped jobs must include a userId parameter.');
    }

    const user = await getUserById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    permissionsContext.setUserInContext(user);
  }

  protected abstract handle(
    heartbeat: HeartbeatCallback,
    params: ExtendedParams,
    jobInfo?: JobInfo
  ): Promise<void>;
}
