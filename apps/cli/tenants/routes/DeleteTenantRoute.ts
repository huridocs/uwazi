import type { Argv } from 'yargs';
import { z } from 'zod';
import { TenantNameInputSchema } from '#api/tenants/application/tenantInputs.js';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';

const addArchivedFlag = (y: Argv) =>
  y.option('archived', {
    type: 'boolean',
    default: false,
    describe: 'Delete the archived tenant instead of the active one',
  });

const archivedFromFlags = (argv: CliArgv, request: unknown) => ({
  ...(request as Record<string, unknown>),
  archived: Boolean(argv.archived),
});

const DeleteTenantInputSchema = TenantNameInputSchema.extend({ archived: z.boolean() }).strict();

type DeleteTenantInput = z.infer<typeof DeleteTenantInputSchema>;

class DeleteTenantRoute implements Route<DeleteTenantInput, { name: string }> {
  readonly command = ['tenants', 'delete'];

  readonly describe =
    'Remove a tenant from the registry, active by default, archived with --archived';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  /** The `--request` JSON only: `archived` is a flag, so it is rejected here. */
  readonly request = TenantNameInputSchema;

  readonly input = DeleteTenantInputSchema;

  readonly fieldMap = {};

  readonly options = addArchivedFlag;

  readonly requestFromFlags = archivedFromFlags;

  private readonly controller = new LazyModule(
    async () => import('../controllers/DeleteTenantController.js')
  );

  async handle(input: DeleteTenantInput): Promise<{ name: string }> {
    const { DeleteTenantController } = await this.controller.get();
    return DeleteTenantController.handle(input);
  }
}

export { DeleteTenantRoute };
