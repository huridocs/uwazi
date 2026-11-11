import { z } from 'zod';

/**
 * What `uwazi archives list` prints: each archived row exactly as the archived registry stored
 * it — `_id` included on MongoDB, absent on Postgres. Owned by the CLI, not shared with the HTTP
 * API.
 */
const ArchiveOutputSchema = z.record(z.unknown());

const ArchivesOutputSchema = z.array(ArchiveOutputSchema);

type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;
type ArchivesOutput = z.infer<typeof ArchivesOutputSchema>;

export { ArchiveOutputSchema, ArchivesOutputSchema };
export type { ArchiveOutput, ArchivesOutput };
