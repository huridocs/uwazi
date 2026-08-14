import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
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
    // UsersDirectory.getById: the Directory takes a hex string and resolves the backend
    // itself, and `UserView` cannot carry credentials at all — the DAO's non-credential
    // column list was a convention, this is the type system. Unconditional, no rollout flag:
    // the DAO path was already backend-agnostic, so there is no legacy branch to keep.
    //
    // getDataOrThrow, as before: a queued email for a user that cannot be resolved should
    // fail the job, not send to `undefined`.
    const user = (await UsersDirectoryFactory.default().getById(params.userId)).getDataOrThrow();

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
