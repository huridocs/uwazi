import { z } from 'zod';
import { User, UserRole } from '../domain/user/User.js';
import { UserAccount } from '../domain/user/UserAccount.js';
import { Credentials } from '../domain/user/Credentials.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';

const CreateUserInputSchema = z.object({
  username: z.string().trim(),
  role: z.nativeEnum(UserRole),
  email: z.string().email(),
  assignedGroupIds: z.array(z.string()).default([]),
  password: z.string().optional(),
  domain: z.string(),
});

type Input = z.infer<typeof CreateUserInputSchema>;

type Output = User;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UserGroupsDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { password, domain, assignedGroupIds, ...userData } = input;

    const identityProps = { _id: this.idGenerator.generate(), ...userData };
    const identity = new User(identityProps);

    (await this.deps.usersDS.checkUniqueUsername(identity)).getDataOrThrow();

    (await this.deps.usersDS.checkUniqueEmail(identity)).getDataOrThrow();

    const user = new UserAccount({
      ...identityProps,
      credentials: new Credentials({ password: await EncryptedPassword.create(password) }),
    });

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.insert(user);
      await this.deps.usergroupsDS.assignGroupsToUser(user._id, assignedGroupIds);
      await this.dispatcher.sendWelcomeEmail({
        userId: user._id,
        domain: input.domain,
      });
    });

    return user;
  }
}

export { CreateUser, CreateUserInputSchema };
export type { Deps as CreateUserDependencies };
