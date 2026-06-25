import { tenants } from '#api/tenants/index.js';
import users from '#api/users/users.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

import { Dispatchable, HeartbeatCallback, JobInfo } from './Dispatchable.js';
import { User } from '#api/core/domain/user/User.js';

type ActorData = Pick<User, '_id' | 'username' | 'role' | 'email' | 'groups'>;

export type UserAwareDispatchableParams = {
  tenantName: string;
  userId?: string;
  actor?: ActorData;
};

export type Params<ExtendedParams> = ExtendedParams & {
  tenantName: string;
  userId?: string;
  actor?: ActorData;
};

export abstract class UserAwareDispatchable<ExtendedParams> implements Dispatchable {
  protected params!: Params<ExtendedParams>;

  protected jobInfo!: JobInfo;

  protected abstract handle(heartBeatCallBack: HeartbeatCallback, jobInfo?: JobInfo): Promise<void>;

  protected get tenantName() {
    const tenantName = this.params.tenantName || this.jobInfo?.namespace;

    if (!tenantName) {
      throw new Error('There is no Tenant, you should provide a tenantName on Job params');
    }

    return tenantName;
  }

  private async setCurrentUser() {
    if (this.params.actor) {
      permissionsContext.setUserInContext(this.params.actor);
    } else if (this.params.userId) {
      const user = await users.getById(this.params.userId, '-password', true);
      if (!user) {
        throw new Error(`User '${this.params.userId}' not found for job`);
      }
      permissionsContext.setUserInContext(user);
    } else {
      throw new Error('No actor or userId provided for job');
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
