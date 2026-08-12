import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { accountLockedEmail } from '#api/core/domain/email/templates/accountLockedEmail.js';

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
    // getById, not findOne: it takes a hex string and each DAO converts it for its own
    // backend. Passing an ObjectId straight through matches in Mongo but silently matches
    // nothing against Postgres' text `_id`. It also limits the row to non-credential columns.
    const user = (await UsersDAOFactory.default().getById(params.userId)).getDataOrThrow();

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
