import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { RecoveryRequestedOutput } from '../contracts.js';
import type { RecoverPasswordCliInput } from '../controllers/RecoverPasswordController.js';

class RecoverPasswordRoute implements Route<RecoverPasswordCliInput, RecoveryRequestedOutput> {
  readonly group = 'users';

  readonly name = 'recover-password';

  readonly describe = 'Email a user a link to set a new password';

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false };

  readonly request = z.object({ email: z.string().email() }).strict();

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/RecoverPasswordController.js')
  );

  async handle(input: RecoverPasswordCliInput): Promise<RecoveryRequestedOutput> {
    const { RecoverPasswordController } = await this.controller.get();
    return RecoverPasswordController.handle(input);
  }
}

export { RecoverPasswordRoute };
