import { ObjectId } from 'mongodb';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

type SendWelcomeEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendWelcomeEmailHandler extends UserAwareDispatchable<SendWelcomeEmailHandlerParams> {
  async handle() {
    const user = await UsersDAOFactory.default().findOne({
      _id: ObjectId.createFromHexString(this.params.userId),
    });

    if (!user) {
      throw new UserNotFound(this.params.userId);
    }

    await users.recoverPassword(user.email, this.params.domain, { newUser: true });
  }
}

export { SendWelcomeEmailHandler };
export type { SendWelcomeEmailHandlerParams };
