import type { Argv } from 'yargs';
import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { ImportTenantOutput } from '../contracts.js';

const ImportInputSchema = z
  .object({ clear: z.boolean().optional(), nullSync: z.boolean().optional() })
  .strict();
type ImportInput = z.infer<typeof ImportInputSchema>;

const importOptions = (y: Argv): Argv =>
  y
    .option('clear', {
      type: 'boolean',
      default: false,
      describe: "Clean the tenant's data before importing (retry a failed import)",
    })
    .option('null-sync', {
      type: 'boolean',
      default: false,
      describe: "Clear the tenant's sync configuration on import (default: preserve it)",
    });

const mergeFlags = (argv: CliArgv, request: unknown): unknown => {
  const merged = { ...(request as Record<string, unknown>) };
  if (argv.clear) merged.clear = true;
  if (argv['null-sync']) merged.nullSync = true;
  return merged;
};

/** Loads a COPY stream from stdin; `--clear` wipes the tenant first, `--null-sync` clears sync config. */
class ImportTenantRoute implements Route<ImportInput, ImportTenantOutput> {
  readonly group = 'tenants';

  readonly name = 'import';

  readonly describe =
    'Restore a tenant from a backup stream on stdin, rewriting tenant_id (--null-sync clears sync config)';

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = ImportInputSchema;

  readonly options = importOptions;

  readonly requestFromFlags = mergeFlags;

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
