import { UserNotFound } from '#api/core/domain/user/errors.js';
import { DeleteUsersUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUsersUseCaseFactory.js';
import type { DeletedUserOutput } from '../contracts.js';
import type { UserReferenceInput } from '../UserReference.js';
import { UserResolver } from '../UserResolver.js';

/** Soft-deletes one user. A user that is unknown or already deleted is not found. */
class DeleteUserController {
  static async handle(input: UserReferenceInput): Promise<DeletedUserOutput> {
    const id = await UserResolver.resolveId(input);

    const deletedCount = await DeleteUsersUseCaseFactory.default().execute({ ids: [id] });
    if (!deletedCount) {
      throw new UserNotFound(id);
    }

    return { id };
  }
}

export { DeleteUserController };
