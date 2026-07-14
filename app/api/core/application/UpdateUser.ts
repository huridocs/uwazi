import { z } from 'zod';
import { User, UserRole } from '../domain/user/User.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';

const UpdateUserInputSchema = z.object({
  _id: z.string(),
  username: z.string().trim(),
  role: z.nativeEnum(UserRole),
  email: z.string().email(),
  groups: z.array(z.object({ _id: z.string(), name: z.string() })).optional(),
  password: z.string().optional(),
});

type Input = z.infer<typeof UpdateUserInputSchema>;

type Output = User;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UsergroupsDataSource };

class UpdateUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { password, ...userData } = input;
    const user = new User(userData);

    (await this.deps.usersDS.checkUniqueUsername(user)).getDataOrThrow();

    (await this.deps.usersDS.checkUniqueEmail(user)).getDataOrThrow();

    if (password) {
      user.setPassword(await EncryptedPassword.create(password));
    }

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.update(user);
      await this.deps.usergroupsDS.updateUserGroups(user);
    });

    return user;
  }
}

export { UpdateUser, UpdateUserInputSchema };
export type { Deps as UpdateUserDependencies };
