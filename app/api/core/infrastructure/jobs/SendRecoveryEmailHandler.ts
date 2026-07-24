import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';

type SendRecoveryEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  email: string;
};

class SendRecoveryEmailHandler extends UserAwareDispatchable<SendRecoveryEmailHandlerParams> {
  async handle() {
    await users.recoverPassword(this.params.email, this.params.domain);
  }
}

export { SendRecoveryEmailHandler };
export type { SendRecoveryEmailHandlerParams };
