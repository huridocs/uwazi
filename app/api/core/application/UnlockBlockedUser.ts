import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

const UnlockBlockedUserInputSchema = z.object({
  _id: z.string(),
});

type Input = z.infer<typeof UnlockBlockedUserInputSchema>;

type Output = void;

type Deps = { usersDS: UsersDataSource };

class UnlockBlockedUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.deps.usersDS.clearLockFields(input._id);
  }
}

export { UnlockBlockedUser, UnlockBlockedUserInputSchema };
export type { Deps as UnlockBlockedUserDependencies };
