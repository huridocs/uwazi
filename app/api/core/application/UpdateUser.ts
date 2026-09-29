/* eslint-disable max-statements */
import { z } from 'zod';
import { PUBLIC_USER_ID, User, UserRole } from '../domain/user/User.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';
import { UpdateUserError } from '../domain/user/errors.js';
import { UnauthorizedError } from '#api/authorization.v2/errors/UnauthorizedError.js';

/**
 * A partial update: omitted fields are left untouched. Shape only; the username, email and
 * role rules belong to the User domain object.
 */
const UpdateUserInputSchema = z.object({
  _id: z.string(),
  username: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  email: z.string().optional(),
  // optional, not `.default([])`: an update that does not mention groups must leave
  // memberships untouched, while `[]` clears them.
  assignedGroupIds: z.array(z.string()).optional(),
  password: z.string().min(1).optional(),
});

type Input = z.input<typeof UpdateUserInputSchema>;

type Output = User;

type Deps = { usersDS: UsersDataSource; usergroupsDS: UserGroupsDataSource };

class UpdateUser extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { _id, password, assignedGroupIds, ...patch } = UpdateUserInputSchema.parse(input);

    if (_id === PUBLIC_USER_ID.toString()) {
      throw new UpdateUserError('Cannot modify system user');
    }

    const user = (await this.deps.usersDS.getAccountById(_id)).getDataOrThrow();

    const actor = this.getActor();
    const isEditingSelf = _id === actor._id;
    const actorIsAdmin = actor.role === 'admin';

    if (!isEditingSelf && !actorIsAdmin) {
      throw new UnauthorizedError();
    }

    if (isEditingSelf && patch.role !== undefined && patch.role !== user.role) {
      throw new UpdateUserError('Cannot change own role');
    }

    const { changed } = user.updateProfile(patch);

    if (changed.includes('username')) {
      (await this.deps.usersDS.checkUniqueUsername(user)).getDataOrThrow();
    }

    if (changed.includes('email')) {
      (await this.deps.usersDS.checkUniqueEmail(user)).getDataOrThrow();
    }

    if (password) {
      user.setPassword(await EncryptedPassword.create(password));
    }

    const groupsToAssign = actorIsAdmin ? assignedGroupIds : undefined;

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.update(user);
      if (groupsToAssign) {
        await this.deps.usergroupsDS.assignGroupsToUser(user._id, groupsToAssign);
      }
    });

    return user;
  }
}

export { UpdateUser, UpdateUserInputSchema };
export type { Deps as UpdateUserDependencies };
