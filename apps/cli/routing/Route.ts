import type { z } from 'zod';
import type { FieldMap } from '../errors/ErrorMapper.js';
import type { ConnectionNeeds } from '../runtime/CliConnections.js';
import type { Tenancy } from '../tenancy/TenantOptions.js';

type CliArgv = Record<string, unknown>;

/**
 * One CLI command, e.g. `uwazi users list`. The CLI counterpart of an Express route plus its
 * controller: it declares the JSON its `--request` takes and calls the use case.
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
  /** Validates `--request` before any connection opens; `--schema` prints it as JSON schema. */
  request: z.ZodType<Input, z.ZodTypeDef, unknown>;
  /** Domain field → request field, for domain errors whose path is not the request's. */
  fieldMap: FieldMap;
  handle(input: Input): Promise<Output>;
}

export type { CliArgv, Route };
