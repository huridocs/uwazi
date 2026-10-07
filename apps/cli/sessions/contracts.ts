import { z } from 'zod';

/**
 * What `uwazi sessions …` prints. Owned by the CLI: the manager depends on these shapes, so
 * fields are only ever added.
 */
const SessionsLastOutputSchema = z.object({
  /** Epoch ms of the tenant's latest session activity; 0 when it has none. */
  lastSession: z.number(),
});

type SessionsLastOutput = z.infer<typeof SessionsLastOutputSchema>;

export { SessionsLastOutputSchema };
export type { SessionsLastOutput };
