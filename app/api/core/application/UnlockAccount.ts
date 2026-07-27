import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

const UnlockAccountInputSchema = z.object({
  username: z.string(),
  code: z.string(),
});

type Input = z.infer<typeof UnlockAccountInputSchema>;

type Output = void;

type Deps = { usersDS: UsersDataSource };

class UnlockAccount extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const user = (
      await this.deps.usersDS.findByUsernameAndUnlockCode(input.username, input.code)
    ).getDataOrThrow();

    await this.deps.usersDS.clearLockFields(user._id);
  }
}

export { UnlockAccount, UnlockAccountInputSchema };
export type { Deps as UnlockAccountDependencies };
