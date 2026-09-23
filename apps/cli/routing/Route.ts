import type { Argv } from 'yargs';
import type { FieldMap } from '../errors/ErrorMapper.js';
import type { ConnectionNeeds } from '../runtime/CliConnections.js';
import type { Tenancy } from '../tenancy/TenantOptions.js';

type CliArgv = Record<string, unknown>;

/**
 * One CLI command, e.g. `uwazi users list`. The CLI counterpart of an Express route plus its
 * controller: it declares its syntax, turns argv into typed input, and calls the use case.
 * Tenant flags and tenant context are not its business: it declares `tenancy` and runs inside
 * whatever tenant the TenantMiddleware selected.
 */
interface Route<Input = unknown, Output = unknown> {
  /** First word of the command (`users`). */
  group: string;
  /** Second word of the command (`list`). */
  name: string;
  describe: string;
  tenancy: Tenancy;
  needs: ConnectionNeeds;
  /** Input field → CLI flag, so validation errors name the flag the user typed. */
  fieldMap: FieldMap;
  options(yargs: Argv): Argv;
  /** Validates argv (zod) and returns the controller input. Runs before any connection opens. */
  toInput(argv: CliArgv): Input;
  handle(input: Input): Promise<Output>;
}

export type { CliArgv, Route };
