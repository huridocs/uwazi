import { randomBytes } from 'node:crypto';
import { encryptPassword } from '#api/auth/encryptPassword.js';
import { User } from '../domain/user/User.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { CreateUserDTO, UserCreateSchema } from './contracts/UserCreateSchema.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { EmailInUse, UsernameExists } from '../domain/user/errors.js';

type Input = { user: CreateUserDTO; domain: string };

type Output = User;

type Dependencies = { usersDS: UsersDataSource };

class CreateUser extends AbstractUseCase<Input, Output, Dependencies> {
  static InputSchema = UserCreateSchema;

  async execute(input: Input): Promise<Output> {
    const { password, ...userData } = input.user;

    const user = new User({ _id: this.idGenerator.generate(), ...userData });

    const usernameExists = await this.deps.usersDS.checkUniqueUsername(user);
    const emailInUse = await this.deps.usersDS.checkUniqueEmail(user);

    if (usernameExists) {
      throw new UsernameExists(user.username);
    }

    if (emailInUse) {
      throw new EmailInUse(user.email);
    }

    const rawPassword = password ?? randomBytes(32).toString('hex');
    const encryptedPassword = await encryptPassword(rawPassword);
    user.setPassword(encryptedPassword);

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.insert(user);
      await this.dispatcher.configureRecoveryPassword({
        userId: user._id,
        domain: input.domain,
      });
    });

    return user;
  }
}

// test the useCase as an integration test. How would I do a backend e2e from the route?

export { CreateUser };
export type { Input, Dependencies };
