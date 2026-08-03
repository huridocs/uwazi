import * as otplib from 'otplib';
import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { TwoFactorTokenInvalid } from '../domain/user/errors.js';

const EnableTwoFactorAuthInputSchema = z.object({
  token: z.string(),
});

type Input = z.infer<typeof EnableTwoFactorAuthInputSchema>;

type Output = void;

type Deps = { usersDS: UsersDataSource };

class EnableTwoFactorAuth extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const secret = (await this.deps.usersDS.getTwoFactorSecret(this.actorId)).getDataOrThrow();

    const validToken = otplib.authenticator.verify({
      token: input.token,
      secret: secret || undefined,
    });

    if (!validToken) {
      throw new TwoFactorTokenInvalid();
    }

    await this.deps.usersDS.enableTwoFactor(this.actorId);
  }
}

export { EnableTwoFactorAuth, EnableTwoFactorAuthInputSchema };
export type { Deps as EnableTwoFactorAuthDependencies };
