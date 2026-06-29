import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';

const DeleteUsersInputSchema = z.object({
  ids: z.string().transform((value, context) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ids must be an array of strings',
        });
        return z.NEVER;
      }
      return parsed;
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids must be a valid JSON array',
      });
      return z.NEVER;
    }
  }),
});

type Input = z.infer<typeof DeleteUsersInputSchema>;

type Output = number;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UsergroupsDataSource };

class DeleteUsers extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { ids } = input;

    this.deps.usersDS.checkIsPublicUser(ids).getDataOrThrow();

    this.deps.usersDS.checkIsDeletingSelf(ids, this.actorId).getDataOrThrow();

    let deletedCount = 0;

    await this.transactionManager.run(async () => {
      deletedCount = await this.deps.usersDS.delete(ids);
      // await this.deps.usergroupsDS.updateUserGroups(user);
    });

    return deletedCount;
  }
}

export { DeleteUsers, DeleteUsersInputSchema };
export type { Deps as DeleteUsersDependencies };
