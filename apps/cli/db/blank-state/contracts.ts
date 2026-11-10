import { z } from 'zod';

/**
 * What `uwazi db blank-state …` prints. Owned by the CLI, not shared with the HTTP API:
 * the manager depends on these shapes, so fields are only ever added.
 */

/** Names of the tenant tables that were (re)written to the dump. Sorted. */
const BlankStateDumpOutputSchema = z.object({ tables: z.array(z.string()) });

const BlankStateRestoreOutputSchema = z.object({ restored: z.literal(true) });

/** The schema versions the dump moved between; equal when it was already current. */
const BlankStateUpgradeOutputSchema = z.object({
  fromVersion: z.number().int().nonnegative(),
  toVersion: z.number().int().nonnegative(),
});

type BlankStateDumpOutput = z.infer<typeof BlankStateDumpOutputSchema>;
type BlankStateRestoreOutput = z.infer<typeof BlankStateRestoreOutputSchema>;
type BlankStateUpgradeOutput = z.infer<typeof BlankStateUpgradeOutputSchema>;

export { BlankStateDumpOutputSchema, BlankStateRestoreOutputSchema, BlankStateUpgradeOutputSchema };
export type { BlankStateDumpOutput, BlankStateRestoreOutput, BlankStateUpgradeOutput };
