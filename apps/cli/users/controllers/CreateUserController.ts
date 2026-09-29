import { UserRole } from '#api/core/domain/user/User.js';
import { CreateUserUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserUseCaseFactory.js';
import { TenantDomain } from '../../tenancy/TenantDomain.js';
import type { CreatedUserOutput } from '../contracts.js';
import { UserOutputs } from '../UserOutputs.js';

type CreateUserCliInput = {
  username: string;
  email: string;
  role: UserRole;
  groups: string[];
  welcomeEmail: boolean;
};

class CreateUserController {
  static async handle(input: CreateUserCliInput): Promise<CreatedUserOutput> {
    const { username, email, role, groups, welcomeEmail } = input;

    const user = await CreateUserUseCaseFactory.default().execute({
      username,
      email,
      role,
      assignedGroupIds: groups,
      domain: TenantDomain.url(),
      sendWelcomeEmail: welcomeEmail,
    });

    return { user: UserOutputs.user(user), welcomeEmailQueued: welcomeEmail };
  }
}

export { CreateUserController };
export type { CreateUserCliInput };
