import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users, { sendAccountLockedEmail } from '#api/users/users.js';

type SendAccountLockedEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendAccountLockedEmailHandler extends UserAwareDispatchable<SendAccountLockedEmailHandlerParams> {
  async handle() {
    const user = await users.getById(this.params.userId, '+accountUnlockCode');
    if (user) {
      await sendAccountLockedEmail(user, this.params.domain);
    }
  }
}

export { SendAccountLockedEmailHandler };
export type { SendAccountLockedEmailHandlerParams };
