import { z } from 'zod';
import { User } from '../domain/user/User.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';

const UserCreateSchema = z.object({
  username: z.string().trim(),
  role: z.enum(['admin', 'editor', 'collaborator']),
  email: z.string().email(),
  groups: z.array(z.object({ _id: z.string(), name: z.string() })).optional(),
  password: z.string().optional(),
});

type CreateUserDTO = z.infer<typeof UserCreateSchema>;

type Input = { user: CreateUserDTO; domain: string };

type Output = User;

type Dependencies = { usersDS: UsersDataSource; usergroupsDS: UsergroupsDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Dependencies> {
  static InputSchema = UserCreateSchema;

  async execute(input: Input): Promise<Output> {
    const { password, ...userData } = input.user;

    const user = new User({ _id: this.idGenerator.generate(), ...userData });

    const usernameResult = await this.deps.usersDS.checkUniqueUsername(user);
    usernameResult.getDataOrThrow();

    const emailResult = await this.deps.usersDS.checkUniqueEmail(user);
    emailResult.getDataOrThrow();

    user.setPassword(await EncryptedPassword.create(password));

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.insert(user);
      await this.deps.usergroupsDS.updateUserGroups(user);
      await this.dispatcher.configureRecoveryPassword({
        userId: user._id,
        domain: input.domain,
        newUser: true,
      });
    });

    return user;
  }
}

export { CreateUser, UserCreateSchema };
export type { Input, Dependencies, CreateUserDTO };
