import { z } from 'zod';
import { User, UserRole } from '../domain/user/User.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';

const CreateUserInputSchema = z.object({
  username: z.string().trim(),
  role: z.nativeEnum(UserRole),
  email: z.string().email(),
  groups: z.array(z.object({ _id: z.string(), name: z.string() })).optional(),
  password: z.string().optional(),
  domain: z.string(),
});

type Input = z.infer<typeof CreateUserInputSchema>;

type Output = User;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UsergroupsDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { password, domain, ...userData } = input;

    const user = new User({ _id: this.idGenerator.generate(), ...userData });

    (await this.deps.usersDS.checkUniqueUsername(user)).getDataOrThrow();

    (await this.deps.usersDS.checkUniqueEmail(user)).getDataOrThrow();

    user.setPassword(await EncryptedPassword.create(password));

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.insert(user);
      await this.deps.usergroupsDS.updateUserGroups(user);
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
