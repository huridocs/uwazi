import { z } from 'zod';
import { PUBLIC_USER_ID, User, UserRole } from '../domain/user/User.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UsergroupsDataSource } from './contracts/UsergroupsDataSource.js';
import { UpdateUserError } from '../domain/user/errors.js';
import { UnauthorizedError } from '#api/authorization.v2/errors/UnauthorizedError.js';

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

    if (userData._id === PUBLIC_USER_ID.toString()) {
      throw new UpdateUserError('Cannot modify system user');
    }

    const user = new User(userData);

    const existingUser = (await this.deps.usersDS.getById(input._id)).getDataOrThrow();

    const actor = this.getActor();
    const isRoleChanged = user.role !== existingUser.role;
    const isEditingSelf = user._id === actor._id;

    if (isRoleChanged && isEditingSelf) {
      throw new UpdateUserError('Cannot change own role');
    }

    if (!isEditingSelf && actor.role !== 'admin') {
      throw new UnauthorizedError();
    }

    if (existingUser.username !== user.username) {
      (await this.deps.usersDS.checkUniqueUsername(user)).getDataOrThrow();
    }

    if (existingUser.email !== user.email) {
      (await this.deps.usersDS.checkUniqueEmail(user)).getDataOrThrow();
    }

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
