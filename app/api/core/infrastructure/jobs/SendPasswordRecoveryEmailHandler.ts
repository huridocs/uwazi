import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { passwordRecoveryEmail } from '#api/core/domain/email/templates/passwordRecoveryEmail.js';
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
    // getById, not findOne: it takes a hex string and each DAO converts it for its own
    // backend. Passing an ObjectId straight through matches in Mongo but silently matches
    // nothing against Postgres' text `_id`. It also limits the row to non-credential columns.
    const user = (await UsersDAOFactory.default().getById(params.userId)).getDataOrThrow();

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
