import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { sendAccountLockedEmail } from '#api/users/users.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';

type SendAccountLockedEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendAccountLockedEmailHandler extends UserAwareDispatchable<SendAccountLockedEmailHandlerParams> {
  async handle() {
    const user = (
      await UsersDAOFactory.default().getById(this.params.userId, {
        includeAccountUnlockCode: true,
      })
    ).getDataOrThrow();
    if (user.accountUnlockCode) {
      await sendAccountLockedEmail(user, this.params.domain);
    }
  }
}

export { SendAccountLockedEmailHandler };
export type { SendAccountLockedEmailHandlerParams };
