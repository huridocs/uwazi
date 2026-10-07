import { z } from 'zod';

/**
 * What `uwazi archives list` prints: each `archives` row exactly as the archive playbook stored
 * it, `_id` included. Owned by the CLI, not shared with the HTTP API.
 */
const ArchiveOutputSchema = z.record(z.unknown());

const ArchivesOutputSchema = z.array(ArchiveOutputSchema);

type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;
type ArchivesOutput = z.infer<typeof ArchivesOutputSchema>;

export { ArchiveOutputSchema, ArchivesOutputSchema };
export type { ArchiveOutput, ArchivesOutput };
