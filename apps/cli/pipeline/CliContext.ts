import type { TenantSelection } from '../tenancy/TenantOptions.js';

/** What flows through the pipeline for one command invocation. */
type CliContext<Input = unknown> = {
  route: string;
  input: Input;
  json: boolean;
  /** Absent for commands that are not tenant-scoped. */
  tenants?: TenantSelection;
  result?: unknown;
};

export type { CliContext };
