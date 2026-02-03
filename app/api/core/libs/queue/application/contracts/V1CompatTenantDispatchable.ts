import { tenants } from '#api/tenants.js';

import { Dispatchable, HeartbeatCallback, JobInfo } from './Dispatchable.js';

export abstract class V1CompatTenantDispatchable<CustomParams extends {}> implements Dispatchable {
  protected abstract handle(
    heartBeatCallBack: HeartbeatCallback,
    params: CustomParams,
    jobInfo?: JobInfo
  ): Promise<void>;

  async handleDispatch(
    heartBeatCallBack: HeartbeatCallback,
    params: CustomParams,
    jobInfo?: JobInfo
  ): Promise<void> {
    await tenants.run(async () => {
      await this.handle(heartBeatCallBack, params, jobInfo);
    }, jobInfo?.namespace);
  }
}
