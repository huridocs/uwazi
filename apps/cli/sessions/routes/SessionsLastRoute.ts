import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { SessionsLastOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class SessionsLastRoute implements Route<NoInput, SessionsLastOutput> {
  readonly group = 'sessions';

  readonly name = 'last';

  readonly describe = "Report when a tenant's last session activity happened";

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false, sessions: true };

  /** Takes no input of its own: --tenant / --all-tenants come from its tenancy. */
  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/SessionsLastController.js')
  );

  async handle(): Promise<SessionsLastOutput> {
    const { SessionsLastController } = await this.controller.get();
    return SessionsLastController.handle();
  }
}

export { SessionsLastRoute };
