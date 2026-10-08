import { z } from 'zod';

/**
 * What `uwazi activity …` takes and prints. Owned by the CLI: the manager depends on these
 * shapes, so fields are only ever added.
 */
const ListActivityRequestSchema = z
  .object({
    /** How many of the latest entries to return. */
    limit: z.number().int().min(1).max(100).default(20),
  })
  .strict();

const ActivityItemSchema = z.object({
  method: z.string(),
  url: z.string(),
  /** null for a request made without a user. */
  username: z.string().nullable(),
  /** Epoch ms. */
  time: z.number(),
});

const ListActivityOutputSchema = z.array(ActivityItemSchema);

type ListActivityRequest = z.infer<typeof ListActivityRequestSchema>;
type ListActivityOutput = z.infer<typeof ListActivityOutputSchema>;

export { ActivityItemSchema, ListActivityOutputSchema, ListActivityRequestSchema };
export type { ListActivityOutput, ListActivityRequest };
