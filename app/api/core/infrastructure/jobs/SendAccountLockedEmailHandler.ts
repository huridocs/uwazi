import { ObjectId } from 'mongodb';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { accountLockedEmail } from '#api/core/domain/email/templates/accountLockedEmail.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

type SendAccountLockedEmailHandlerParams = UwaziJobParams & {
  domain: string;
  userId: string;
  unlockCode: string;
};

@PrivilegedJob()
class SendAccountLockedEmailHandler extends UwaziJobHandler<SendAccountLockedEmailHandlerParams> {
  constructor(private deps: { emailSender: EmailSender }) {
    super();
  }

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: SendAccountLockedEmailHandlerParams
  ) {
    const user = await UsersDAOFactory.default().findOne({
      _id: ObjectId.createFromHexString(params.userId),
    });

    if (!user) {
      throw new UserNotFound(params.userId);
    }

    const message = accountLockedEmail({
      to: user.email,
      username: user.username,
      domain: params.domain,
      unlockCode: params.unlockCode,
    });

    await this.deps.emailSender.send(message);
  }
}

export { SendAccountLockedEmailHandler };
export type { SendAccountLockedEmailHandlerParams };
