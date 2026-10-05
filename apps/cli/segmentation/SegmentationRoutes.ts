import type { Route } from '../routing/Route.js';
import { QueueIdleSegmentationsRoute } from './routes/QueueIdleSegmentationsRoute.js';

/** `uwazi segmentation …` */
class SegmentationRoutes {
  static all(): Route[] {
    return [new QueueIdleSegmentationsRoute()];
  }
}

export { SegmentationRoutes };
