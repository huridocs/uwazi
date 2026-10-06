import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { QueueIdleSegmentationsOutput } from '../contracts.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class QueueIdleSegmentationsRoute implements Route<NoInput, QueueIdleSegmentationsOutput> {
  readonly group = 'segmentation';

  readonly name = 'queue-idle';

  readonly describe = "Request a tenant's idle segmentations, when it has segmentation on";

  readonly tenancy = 'single';

  readonly needs = { redis: false, elasticsearch: false };

  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/QueueIdleSegmentationsController.js')
  );

  async handle(): Promise<QueueIdleSegmentationsOutput> {
    const { QueueIdleSegmentationsController } = await this.controller.get();
    return QueueIdleSegmentationsController.handle();
  }
}

export { QueueIdleSegmentationsRoute };
