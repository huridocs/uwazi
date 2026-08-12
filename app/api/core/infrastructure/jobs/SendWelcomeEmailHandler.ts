import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { SendWelcomeEmail } from '#api/core/application/SendWelcomeEmail.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type SendWelcomeEmailHandlerParams = UwaziJobParams & {
  domain: string;
  userId: string;
};

@PrivilegedJob()
class SendWelcomeEmailHandler extends UwaziJobHandler<SendWelcomeEmailHandlerParams> {
  constructor(private deps: { sendWelcomeEmail: SendWelcomeEmail }) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: SendWelcomeEmailHandlerParams) {
    await this.deps.sendWelcomeEmail.execute({
      userId: params.userId,
      domain: params.domain,
    });
  }
}

export { SendWelcomeEmailHandler };
export type { SendWelcomeEmailHandlerParams };
