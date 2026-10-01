import { z } from 'zod';
import { User, UserRole } from '../domain/user/User.js';
import { UserAccount } from '../domain/user/UserAccount.js';
import { Credentials } from '../domain/user/Credentials.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';

/**
 * Shape only: the username, email and role rules belong to the User domain object, so every
 * path that creates a user enforces the same ones.
 */
const CreateUserInputSchema = z.object({
  username: z.string(),
  role: z.nativeEnum(UserRole),
  email: z.string(),
  assignedGroupIds: z.array(z.string()).default([]),
  // `.min(1)`: an empty string is not nullish, so it would reach EncryptedPassword.create
  // and be hashed as a real password instead of falling back to a random one.
  password: z.string().min(1).optional(),
  domain: z.string(),
  sendWelcomeEmail: z.boolean().default(true),
});

type Input = z.input<typeof CreateUserInputSchema>;

type Output = User;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UserGroupsDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { password, domain, assignedGroupIds, sendWelcomeEmail, ...userData } =
      CreateUserInputSchema.parse(input);

    const identity = User.create({ _id: this.idGenerator.generate(), ...userData });

    (await this.deps.usersDS.checkUniqueUsername(identity)).getDataOrThrow();

    (await this.deps.usersDS.checkUniqueEmail(identity)).getDataOrThrow();

    const user = UserAccount.create({
      ...identity,
      credentials: new Credentials({ password: await EncryptedPassword.create(password) }),
    });

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.insert(user);
      await this.deps.usergroupsDS.assignGroupsToUser(user._id, assignedGroupIds);
      if (sendWelcomeEmail) {
        await this.dispatcher.sendWelcomeEmail({ userId: user._id, domain });
      }
    });

    return user;
  }
}

export { CreateUser, CreateUserInputSchema };
export type { Deps as CreateUserDependencies };
