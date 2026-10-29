import { z } from 'zod';

/**
 * What `uwazi blank-state …` prints. Owned by the CLI, not shared with the HTTP API:
 * the manager depends on these shapes, so fields are only ever added.
 */

/** Names of the tenant tables that were (re)written to the dump. Sorted. */
const BlankStateDumpOutputSchema = z.object({ tables: z.array(z.string()) });

const BlankStateRestoreOutputSchema = z.object({ restored: z.literal(true) });

type BlankStateDumpOutput = z.infer<typeof BlankStateDumpOutputSchema>;
type BlankStateRestoreOutput = z.infer<typeof BlankStateRestoreOutputSchema>;

export { BlankStateDumpOutputSchema, BlankStateRestoreOutputSchema };
export type { BlankStateDumpOutput, BlankStateRestoreOutput };
