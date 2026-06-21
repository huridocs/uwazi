import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import users from '#api/users/users.js';

type ConfigureRecoveryPasswordHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
  newUser?: boolean;
};

class ConfigureRecoveryPasswordHandler extends UserAwareDispatchable<ConfigureRecoveryPasswordHandlerParams> {
  async handle() {
    const { email } = await users.getById(this.params.userId);
    await users.recoverPassword(email, this.params.domain, { newUser: this.params.newUser });
  }
}

export { ConfigureRecoveryPasswordHandler };
export type { ConfigureRecoveryPasswordHandlerParams };
