import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { SendWelcomeEmail } from '#api/core/application/SendWelcomeEmail.js';

type SendWelcomeEmailHandlerParams = UserAwareDispatchableParams & {
  domain: string;
  userId: string;
};

class SendWelcomeEmailHandler extends UserAwareDispatchable<SendWelcomeEmailHandlerParams> {
  constructor(private deps: { sendWelcomeEmail: SendWelcomeEmail }) {
    super();
  }

  async handle() {
    await this.deps.sendWelcomeEmail.execute({
      userId: this.params.userId,
      domain: this.params.domain,
    });
  }
}

export { SendWelcomeEmailHandler };
export type { SendWelcomeEmailHandlerParams };
