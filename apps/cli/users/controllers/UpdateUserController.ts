import { UserRole } from '#api/core/domain/user/User.js';
import { UpdateUserUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserUseCaseFactory.js';
import type { UpdatedUserOutput } from '../contracts.js';
import { UserOutputs } from '../UserOutputs.js';
import type { UserReferenceInput } from '../UserReference.js';
import { UserResolver } from '../UserResolver.js';

/** Omitted fields are left as they are; `groups: []` removes the user from every group. */
type UpdateUserCliInput = UserReferenceInput & {
  newUsername?: string;
  email?: string;
  role?: UserRole;
  groups?: string[];
};

class UpdateUserController {
  static async handle(input: UpdateUserCliInput): Promise<UpdatedUserOutput> {
    const { newUsername, email, role, groups } = input;

    const user = await UpdateUserUseCaseFactory.default().execute({
      _id: await UserResolver.resolveId(input),
      username: newUsername,
      email,
      role,
      assignedGroupIds: groups,
    });

    return { user: UserOutputs.user(user) };
  }
}

export { UpdateUserController };
export type { UpdateUserCliInput };
