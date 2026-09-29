import type { CliContext } from '../pipeline/CliContext.js';
import type { Middleware } from '../pipeline/Middleware.js';
import type { Route } from './Route.js';

/** The end of the pipeline: runs the route and stores its result for the presenter. */
class ControllerMiddleware implements Middleware {
  constructor(private readonly route: Route) {}

  async handle(context: CliContext, next: () => Promise<void>): Promise<void> {
    context.result = await this.route.handle(context.input);
    await next();
  }
}

export { ControllerMiddleware };
