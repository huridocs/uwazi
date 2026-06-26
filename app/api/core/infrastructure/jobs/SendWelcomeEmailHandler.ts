import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';

type SendWelcomeEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendWelcomeEmailHandler extends UserAwareDispatchable<SendWelcomeEmailHandlerParams> {
  async handle() {
    const { email } = await users.getById(this.params.userId);
    await users.recoverPassword(email, this.params.domain, { newUser: true });
  }
}

export { SendWelcomeEmailHandler };
export type { SendWelcomeEmailHandlerParams };
