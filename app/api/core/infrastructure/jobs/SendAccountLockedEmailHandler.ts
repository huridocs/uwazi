import { ObjectId } from 'mongodb';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { accountLockedEmail } from '#api/core/domain/email/templates/accountLockedEmail.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

type SendAccountLockedEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
  unlockCode: string;
};

class SendAccountLockedEmailHandler extends UserAwareDispatchable<SendAccountLockedEmailHandlerParams> {
  constructor(private deps: { emailSender: EmailSender }) {
    super();
  }

  async handle() {
    const user = await UsersDAOFactory.default().findOne({
      _id: ObjectId.createFromHexString(this.params.userId),
    });

    if (!user) {
      throw new UserNotFound(this.params.userId);
    }

    const message = accountLockedEmail({
      to: user.email,
      username: user.username,
      domain: this.params.domain,
      unlockCode: this.params.unlockCode,
    });

    await this.deps.emailSender.send(message);
  }
}

export { SendAccountLockedEmailHandler };
export type { SendAccountLockedEmailHandlerParams };
