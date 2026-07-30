import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';
import { IsDeletingSelf, IsDeleteOfLastUser, IsDeleteOfPublicUser } from '../domain/user/errors.js';
import { PUBLIC_USER_ID } from '../domain/user/User.js';

const Schema = z.object({
  ids: z.array(z.string()),
});

type Input = z.infer<typeof Schema>;

type Output = number;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UsergroupsDataSource };

class DeleteUsers extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { ids } = input;

    if (ids.includes(PUBLIC_USER_ID.toString())) {
      throw new IsDeleteOfPublicUser();
    }

    if ((await this.deps.usersDS.countActiveUsers()) === 1) {
      throw new IsDeleteOfLastUser();
    }

    if (ids.includes(this.actorId)) {
      throw new IsDeletingSelf();
    }

    let deletedCount = 0;

    await this.transactionManager.run(async () => {
      deletedCount = await this.deps.usersDS.delete(ids);
      await this.deps.usergroupsDS.removeUsersFromGroups(ids);
    });

    return deletedCount;
  }
}

export { DeleteUsers, Schema as DeleteUserInputSchema };
export type { Deps as DeleteUsersDependencies };
