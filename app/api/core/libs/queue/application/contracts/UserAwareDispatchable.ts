import { tenants } from '#api/tenants/index.js';
import users from '#api/users/users.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

import { Dispatchable, HeartbeatCallback, JobInfo } from './Dispatchable.js';

export type UserAwareDispatchableParams = { tenantName: string; userId?: string };

export type Params<ExtendedParams> = ExtendedParams & { tenantName: string; userId?: string };

export abstract class UserAwareDispatchable<ExtendedParams> implements Dispatchable {
  protected params!: Params<ExtendedParams>;

  protected jobInfo!: JobInfo;

  private static readonly SYSTEM_USER = {
    _id: 'system',
    username: 'system',
    role: 'admin' as const,
    email: 'system@uwazi',
    groups: [],
  };

  protected abstract handle(heartBeatCallBack: HeartbeatCallback, jobInfo?: JobInfo): Promise<void>;

  protected get tenantName() {
    const tenantName = this.params.tenantName || this.jobInfo?.namespace;

    if (!tenantName) {
      throw new Error('There is no Tenant, you should provide a tenantName on Job params');
    }

    return tenantName;
  }

  private async setCurrentUser() {
    if (this.params.userId) {
      const user = await users.getById(this.params.userId, '-password', true);
      permissionsContext.setUserInContext(user ?? UserAwareDispatchable.SYSTEM_USER);
    } else {
      permissionsContext.setUserInContext(UserAwareDispatchable.SYSTEM_USER);
    }
  }

  async handleDispatch(
    heartBeatCallBack: HeartbeatCallback,
    params: Params<ExtendedParams>,
    jobInfo?: JobInfo
  ): Promise<void> {
    this.params = params;
    this.jobInfo = jobInfo!;

    await tenants.run(async () => {
      await this.setCurrentUser();
      await this.handle(heartBeatCallBack, jobInfo);
    }, this.tenantName);
  }
}
