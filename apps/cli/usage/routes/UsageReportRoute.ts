import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { UsageReportOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class UsageReportRoute implements Route<NoInput, UsageReportOutput> {
  readonly group = 'usage';

  readonly name = 'report';

  readonly describe = 'Report what a tenant consumes: content, storage, last activity';

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false, sessions: true };

  /** Takes no input of its own: --tenant / --all-tenants come from its tenancy. */
  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UsageReportController.js')
  );

  async handle(): Promise<UsageReportOutput> {
    const { UsageReportController } = await this.controller.get();
    return UsageReportController.handle();
  }
}

export { UsageReportRoute };
