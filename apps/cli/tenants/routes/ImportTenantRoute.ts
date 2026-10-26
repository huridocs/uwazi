import type { Argv } from 'yargs';
import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { ImportTenantOutput } from '../contracts.js';

const ImportInputSchema = z.object({ clear: z.boolean().optional() }).strict();
type ImportInput = z.infer<typeof ImportInputSchema>;

const clearOption = (y: Argv): Argv =>
  y.option('clear', {
    type: 'boolean',
    default: false,
    describe: "Clean the tenant's data before importing (retry a failed import)",
  });

const mergeClearFlag = (argv: CliArgv, request: unknown): unknown =>
  argv.clear ? { ...(request as Record<string, unknown>), clear: true } : request;

/** Loads a COPY stream from stdin; `--clear` wipes the tenant first so a failed import can retry. */
class ImportTenantRoute implements Route<ImportInput, ImportTenantOutput> {
  readonly group = 'tenants';

  readonly name = 'import';

  readonly describe = 'Restore a tenant from a backup stream on stdin, rewriting tenant_id';

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = ImportInputSchema;

  readonly options = clearOption;

  readonly requestFromFlags = mergeClearFlag;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/ImportTenantController.js')
  );

  async handle(input: ImportInput): Promise<ImportTenantOutput> {
    const { ImportTenantController } = await this.controller.get();
    return ImportTenantController.handle(input);
  }
}

export { ImportTenantRoute };
