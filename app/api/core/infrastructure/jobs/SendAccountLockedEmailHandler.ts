import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
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
    // UsersDirectory.getById: the Directory takes a hex string and resolves the backend
    // itself, and `UserView` cannot carry credentials at all — the DAO's non-credential
    // column list was a convention, this is the type system. Unconditional, no rollout flag:
    // the DAO path was already backend-agnostic, so there is no legacy branch to keep.
    //
    // getDataOrThrow, as before: a queued email for a user that cannot be resolved should
    // fail the job, not send to `undefined`.
    const user = (await UsersDirectoryFactory.default().getById(params.userId)).getDataOrThrow();

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
