import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

type Input = { username: string; submittedPassword: string };
type Deps = { usersDS: UsersDataSource };

class ValidateCurrentPassword extends AbstractUseCase<Input, boolean, Deps> {
  async execute(input: Input): Promise<boolean> {
    const result = await this.deps.usersDS.getByUsername(input.username);

    if (result.isError()) {
      return false;
    }

    const user = result.getDataOrThrow();
    return user.credentials!.password.compare(input.submittedPassword);
  }
}

export { ValidateCurrentPassword };
