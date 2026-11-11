import type { Argv } from 'yargs';
import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { TenantsOutput } from '../contracts.js';

const addArchivedFlag = (y: Argv) =>
  y.option('archived', { type: 'boolean', default: false, describe: 'List archived tenants' });

const archivedFromFlags = (argv: CliArgv, request: unknown) => ({
  ...(request as Record<string, unknown>),
  archived: Boolean(argv.archived),
});

class ListTenantsRoute implements Route<{ archived: boolean }, TenantsOutput> {
  readonly command = ['tenants', 'list'];

  readonly describe = 'List every tenant, active by default, archived with --archived';

  readonly tenancy = 'none';

  readonly needs = { redis: false, sessions: false };

  /** The `--request` JSON only: `archived` is a flag, so it is rejected here. */
  readonly request = z.object({}).strict();

  readonly input = z.object({ archived: z.boolean() }).strict();

  readonly fieldMap = {};

  readonly options = addArchivedFlag;

  readonly requestFromFlags = archivedFromFlags;

  private readonly controller = new LazyModule(
    async () => import('../controllers/ListTenantsController.js')
  );

  async handle(input: { archived: boolean }): Promise<TenantsOutput> {
    const { ListTenantsController } = await this.controller.get();
    return ListTenantsController.handle(input);
  }
}

export { ListTenantsRoute };
