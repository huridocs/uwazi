import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

const ResetTwoFactorAuthInputSchema = z.object({
  _id: z.string(),
});

type Input = z.infer<typeof ResetTwoFactorAuthInputSchema>;

type Output = void;

type Deps = { usersDS: UsersDataSource };

class ResetTwoFactorAuth extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.deps.usersDS.disableTwoFactor(input._id);
  }
}

export { ResetTwoFactorAuth, ResetTwoFactorAuthInputSchema };
export type { Deps as ResetTwoFactorAuthDependencies };
