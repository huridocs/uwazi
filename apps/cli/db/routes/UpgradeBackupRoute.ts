import type { Argv } from 'yargs';
import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { UpgradeBackupOutput } from '../contracts.js';

const UpgradeBackupInputSchema = z
  .object({
    input: z.string().min(1),
    output: z.string().min(1),
    force: z.boolean().optional(),
  })
  .strict();
type UpgradeBackupInput = z.infer<typeof UpgradeBackupInputSchema>;

const upgradeOptions = (y: Argv): Argv =>
  y
    .option('input', { type: 'string', describe: 'The backup file to upgrade' })
    .option('output', { type: 'string', describe: 'Where to write the upgraded backup' })
    .option('force', {
      type: 'boolean',
      default: false,
      describe: 'Replace the output file if it exists',
    });

const mergeFlags = (argv: CliArgv, request: unknown): unknown => {
  const merged = { ...(request as Record<string, unknown>) };
  if (argv.input !== undefined) merged.input = argv.input;
  if (argv.output !== undefined) merged.output = argv.output;
  if (argv.force) merged.force = true;
  return merged;
};

/** Migrates a backup file to the latest schema through a scratch database; never the live one. */
class UpgradeBackupRoute implements Route<UpgradeBackupInput, UpgradeBackupOutput> {
  readonly command = ['db', 'upgrade'];

  readonly describe =
    'Upgrade a backup file to the latest PostgreSQL schema in a scratch database (never the live one)';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true, scratchDatabase: true };

  readonly request = UpgradeBackupInputSchema;

  readonly options = upgradeOptions;

  readonly requestFromFlags = mergeFlags;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/UpgradeBackupController.js')
  );

  async handle(input: UpgradeBackupInput): Promise<UpgradeBackupOutput> {
    const { UpgradeBackupController } = await this.controller.get();
    return UpgradeBackupController.handle(input);
  }
}

export { UpgradeBackupRoute };
