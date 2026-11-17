import { z } from 'zod';
import { TenantNameInputSchema } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { TenantOutput } from '../contracts.js';

/** `name` as `tenants get` accepts it, plus the dump the archive playbook just produced. */
const ArchiveTenantInputSchema = TenantNameInputSchema.extend({
  dumpLocation: z.object({ db: z.string(), files: z.string() }).strict(),
}).strict();

type ArchiveTenantInput = z.infer<typeof ArchiveTenantInputSchema>;

class ArchiveTenantRoute implements Route<ArchiveTenantInput, TenantOutput> {
  readonly command = ['tenants', 'archive'];

  readonly describe = 'Move a tenant from the active registry to the archived registry';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  readonly request = ArchiveTenantInputSchema;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ArchiveTenantController.js')
  );

  async handle(input: ArchiveTenantInput): Promise<TenantOutput> {
    const { ArchiveTenantController } = await this.controller.get();
    return ArchiveTenantController.handle(input);
  }
}

export { ArchiveTenantRoute };
