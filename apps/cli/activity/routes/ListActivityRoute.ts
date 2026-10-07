import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import {
  ListActivityRequestSchema,
  type ListActivityOutput,
  type ListActivityRequest,
} from '../contracts.js';

class ListActivityRoute implements Route<ListActivityRequest, ListActivityOutput> {
  readonly group = 'activity';

  readonly name = 'list';

  readonly describe = "List a tenant's latest activity log entries";

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false };

  readonly request = ListActivityRequestSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ListActivityController.js')
  );

  async handle(input: ListActivityRequest): Promise<ListActivityOutput> {
    const { ListActivityController } = await this.controller.get();
    return ListActivityController.handle(input);
  }
}

export { ListActivityRoute };
