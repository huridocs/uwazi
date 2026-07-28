import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { passwordRecoveryEmail } from '#api/core/domain/email/templates/passwordRecoveryEmail.js';

type SendPasswordRecoveryEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
  key: string;
};

class SendPasswordRecoveryEmailHandler extends UserAwareDispatchable<SendPasswordRecoveryEmailHandlerParams> {
  constructor(private deps: { emailSender: EmailSender }) {
    super();
  }

  async handle() {
    const user = (await UsersDAOFactory.default().getById(this.params.userId)).getDataOrThrow();

    const message = passwordRecoveryEmail({
      to: user.email,
      username: user.username,
      domain: this.params.domain,
      key: this.params.key,
    });

    await this.deps.emailSender.send(message);
  }
}

export { SendPasswordRecoveryEmailHandler };
export type { SendPasswordRecoveryEmailHandlerParams };
