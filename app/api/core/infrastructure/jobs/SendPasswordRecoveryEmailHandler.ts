import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { ObjectId } from 'mongodb';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { passwordRecoveryEmail } from '#api/core/domain/email/templates/passwordRecoveryEmail.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type SendPasswordRecoveryEmailHandlerParams = UwaziJobParams & {
  domain: string;
  userId: string;
  key: string;
};

@PrivilegedJob()
class SendPasswordRecoveryEmailHandler extends UwaziJobHandler<SendPasswordRecoveryEmailHandlerParams> {
  constructor(private deps: { emailSender: EmailSender }) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: SendPasswordRecoveryEmailHandlerParams) {
    const user = await UsersDAOFactory.default().findOne({
      _id: ObjectId.createFromHexString(params.userId),
    });

    if (!user) {
      throw new UserNotFound(params.userId);
    }

    const message = passwordRecoveryEmail({
      to: user.email,
      username: user.username,
      domain: params.domain,
      key: params.key,
    });

    await this.deps.emailSender.send(message);
  }
}

export { SendPasswordRecoveryEmailHandler };
export type { SendPasswordRecoveryEmailHandlerParams };
