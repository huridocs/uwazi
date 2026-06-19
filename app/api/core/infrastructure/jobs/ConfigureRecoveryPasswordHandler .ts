import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';

type ConfigureRecoveryPasswordHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class ConfigureRecoveryPasswordHandler extends UserAwareDispatchable<ConfigureRecoveryPasswordHandlerParams> {
  async handle() {
    const { email } = await users.getById(this.params.userId);
    await users.recoverPassword(email, this.params.domain, { newUser: true });
  }
}

export { ConfigureRecoveryPasswordHandler };
export type { ConfigureRecoveryPasswordHandlerParams };
