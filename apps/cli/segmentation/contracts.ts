import { z } from 'zod';

/** What `uwazi segmentation queue-idle` prints. Owned by the CLI. */
const QueueIdleSegmentationsOutputSchema = z.object({
  segmentationEnabled: z.boolean(),
  requested: z.number().int().nonnegative(),
});

type QueueIdleSegmentationsOutput = z.infer<typeof QueueIdleSegmentationsOutputSchema>;

export { QueueIdleSegmentationsOutputSchema };
export type { QueueIdleSegmentationsOutput };
