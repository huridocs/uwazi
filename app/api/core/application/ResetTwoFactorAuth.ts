import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';

/**
 * `_id` is pinned to the ObjectId shape rather than left a bare string: it reaches
 * `ObjectId.createFromHexString` on the Mongo backend, which throws a BSONError that
 * `handleError` renders as a 500. The route's ajv `ObjectIdAsString` used to be the guard;
 * this replaces it. Postgres stores the same hex string in a TEXT column, so one rule fits
 * both backends.
 */
const ResetTwoFactorAuthInputSchema = z.object({
  _id: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

type Input = z.infer<typeof ResetTwoFactorAuthInputSchema>;

type Output = void;

type Deps = { usersDS: UsersDataSource };

class ResetTwoFactorAuth extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.deps.usersDS.disableTwoFactor(input._id);
  }
}

export { ResetTwoFactorAuth, ResetTwoFactorAuthInputSchema };
export type { Deps as ResetTwoFactorAuthDependencies };
