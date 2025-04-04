import { tenants } from 'api/tenants';
import users from 'api/users/users';
import { permissionsContext } from 'api/permissions/permissionsContext';

import { Dispatchable, HeartbeatCallback, JobInfo } from './Dispatchable';

export type UserAwareDispatchableParams = { tenantName: string; userId: string };

export abstract class UserAwareDispatchable<CustomParams extends UserAwareDispatchableParams>
  implements Dispatchable
{
  protected params!: CustomParams;

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
    params: CustomParams,
    jobInfo?: JobInfo
  ): Promise<void> {
    this.params = params;

    await tenants.run(async () => {
      await this.setCurrentUser();
      await this.handle(heartBeatCallBack, jobInfo);
    }, this.tenantName);
  }
}
