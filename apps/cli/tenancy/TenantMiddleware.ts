import type { CliContext } from '../pipeline/CliContext.js';
import type { Middleware } from '../pipeline/Middleware.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { AllTenants } from './AllTenants.js';
import { CliTenancy } from './CliTenancy.js';

/**
 * Runs the rest of the pipeline inside the selected tenant, as the system actor.
 *
 * With --all-tenants the rest runs once per tenant. Pipeline forbids calling next() twice, so
 * this middleware is given the downstream middlewares and runs them itself, on a fresh context
 * per tenant, collecting every tenant's result (or error) into the original context.
 */
class TenantMiddleware implements Middleware {
  constructor(private readonly downstream: Middleware[]) {}

  async handle(context: CliContext, next: () => Promise<void>): Promise<void> {
    const { tenants } = context;

    if (!tenants) {
      await next();
      return;
    }

    if (tenants.allTenants) {
      context.result = await AllTenants.collect(async () => this.runDownstream(context));
      return;
    }

    await CliTenancy.run(await CliTenancy.resolve(tenants.tenant ?? ''), next);
  }

  private async runDownstream(context: CliContext): Promise<unknown> {
    const tenantContext: CliContext = { ...context, result: undefined };
    await new Pipeline(this.downstream).run(tenantContext);
    return tenantContext.result;
  }
}

export { TenantMiddleware };
