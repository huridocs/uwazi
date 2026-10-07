import { RecoverPasswordUseCaseFactory } from '#api/core/infrastructure/factories/RecoverPasswordUseCaseFactory.js';
import { TenantDomain } from '../../tenancy/TenantDomain.js';
import type { RecoveryRequestedOutput } from '../contracts.js';

type RecoverPasswordCliInput = { email: string };

/** Queues a password recovery email for the active user with the email, if there is one. */
class RecoverPasswordController {
  static async handle({ email }: RecoverPasswordCliInput): Promise<RecoveryRequestedOutput> {
    const domain = TenantDomain.url();

    return RecoverPasswordUseCaseFactory.default().execute({ email, domain });
  }
}

export { RecoverPasswordController };
export type { RecoverPasswordCliInput };
