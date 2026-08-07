import { tenants } from '#api/tenants/index.js';
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
    jobInfo?: JobInfo,
  ): Promise<void> {
    const extendedParams = params as ExtendedParams;
    const tenantName = jobInfo?.namespace;

    if (tenantName) {
      await tenants.run(async () => {
        await this.handle(heartbeat, extendedParams, jobInfo);
      }, tenantName);
    } else {
      await this.handle(heartbeat, extendedParams, jobInfo);
    }
  }

  protected abstract handle(
    heartbeat: HeartbeatCallback,
    params: ExtendedParams,
    jobInfo?: JobInfo,
  ): Promise<void>;
}
