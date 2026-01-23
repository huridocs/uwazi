import { tenants } from '#api/tenants/index.js';

import users from '#api/users/users.js';

import { permissionsContext } from '#api/permissions/permissionsContext.js';

import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';

export type UserAwareDispatchableParams = { tenantName: string; userId: string };

export type Params<ExtendedParams> = ExtendedParams & { tenantName: string; userId: string };

export abstract class UserAwareDispatchable<ExtendedParams> implements Dispatchable {
  protected params!: Params<ExtendedParams>;

  protected abstract handle(heartBeatCallBack: HeartbeatCallback, jobInfo?: JobInfo): Promise<void>;

  protected get tenantName() {
    if (!this.params.tenantName) {
      throw new Error('There is no Tenant, you should provide a tenantName on Job params');
    }

    return this.params.tenantName;
  }

  protected get userId() {
    if (!this.params.userId) {
      throw new Error('There is no userId, you should provide a userId on Job params');
    }

    return this.params.userId;
  }

  private async setCurrentUser() {
    const user = await users.getById(this.userId, '-password', true);
    permissionsContext.setUserInContext(user);
  }

  async handleDispatch(
    heartBeatCallBack: HeartbeatCallback,
    params: Params<ExtendedParams>,
    jobInfo?: JobInfo
  ): Promise<void> {
    this.params = params;

    await tenants.run(async () => {
      await this.setCurrentUser();
      await this.handle(heartBeatCallBack, jobInfo);
    }, this.tenantName);
  }
}
