import { z } from 'zod';
import crypto from 'crypto';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { PasswordRecoveriesDataSource } from './contracts/PasswordRecoveriesDataSource.js';

const RecoverPasswordInputSchema = z.object({
  email: z.string().email(),
  domain: z.string(),
});

type Input = z.infer<typeof RecoverPasswordInputSchema>;

type Output = { recoveryEmailQueued: boolean };

type Deps = {
  usersDS: UsersDataSource;
  passwordRecoveriesDS: PasswordRecoveriesDataSource;
};

class RecoverPassword extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const userResult = await this.deps.usersDS.getByEmail(input.email);
    if (userResult.isError()) return { recoveryEmailQueued: false };
    const user = userResult.getDataOrThrow();

    const token = crypto.randomBytes(32).toString('hex');

    await this.transactionManager.run(async () => {
      await this.deps.passwordRecoveriesDS.create({ userId: user._id, key: token });
      await this.dispatcher.sendPasswordRecoveryEmail({
        userId: user._id,
        domain: input.domain,
        key: token,
      });
    });

    return { recoveryEmailQueued: true };
  }
}

export { RecoverPassword, RecoverPasswordInputSchema };
export type { Output as RecoverPasswordOutput };
