import { z } from 'zod';

/**
 * The shape every failing command writes to stderr (as text with --pretty). Callers branch on `code`
 * (stable, namespaced) and the exit code; `message` is for people and may change.
 */
const ErrorPayloadSchema = z.object({
  error: z.object({
    code: z.string(),
    category: z.enum(['validation', 'not_found', 'conflict', 'rule_violation', 'unexpected']),
    message: z.string(),
    validation: z
      .array(z.object({ field: z.string(), code: z.string(), message: z.string() }))
      .optional(),
    details: z.record(z.unknown()).optional(),
    correlationId: z.string().optional(),
  }),
});

type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
type ErrorPayloadCategory = ErrorPayload['error']['category'];

export { ErrorPayloadSchema };
export type { ErrorPayload, ErrorPayloadCategory };
