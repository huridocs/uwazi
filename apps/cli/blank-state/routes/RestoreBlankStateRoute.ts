import type { Argv } from 'yargs';
import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { BlankStateRestoreOutput } from '../contracts.js';
import type { RestoreBlankStateInput } from '../controllers/RestoreBlankStateController.js';

const forceOption = (y: Argv): Argv =>
  y.option('force', {
    type: 'boolean',
    default: false,
    describe: 'Overwrite the tenant data instead of failing when it exists',
  });

const mergeForceFlag = (argv: CliArgv, request: unknown): unknown =>
  argv.force ? { ...(request as Record<string, unknown>), force: true } : request;

class RestoreBlankStateRoute implements Route<RestoreBlankStateInput, BlankStateRestoreOutput> {
  readonly group = 'blank-state';

  readonly name = 'restore';

  readonly describe = 'Restore the blank-state dump into a tenant (destructive with force)';

  readonly tenancy = 'single';

  readonly needs = { redis: false, sessions: false, postgresAdmin: true };

  readonly request = z.object({ force: z.boolean().optional() }).strict();

  readonly options = forceOption;

  readonly requestFromFlags = mergeForceFlag;

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/RestoreBlankStateController.js')
  );

  async handle(input: RestoreBlankStateInput): Promise<BlankStateRestoreOutput> {
    const { RestoreBlankStateController } = await this.controller.get();
    return RestoreBlankStateController.handle(input);
  }
}

export { RestoreBlankStateRoute };
