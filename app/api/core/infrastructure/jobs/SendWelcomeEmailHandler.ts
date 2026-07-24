import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';

type SendWelcomeEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendWelcomeEmailHandler extends UserAwareDispatchable<SendWelcomeEmailHandlerParams> {
  async handle() {
    const user = (await UsersDAOFactory.default().getById(this.params.userId)).getDataOrThrow();
    if (user._id) {
      await users.recoverPassword(user.email, this.params.domain, { newUser: true });
    }
  }
}

export { SendWelcomeEmailHandler };
export type { SendWelcomeEmailHandlerParams };
