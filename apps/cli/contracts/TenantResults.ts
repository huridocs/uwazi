import { z } from 'zod';
import { ErrorPayloadSchema } from './ErrorPayload.js';

type TenantResults<T> = {
  results: { tenant: string; data: T }[];
  errors: { tenant: string; error: z.infer<typeof ErrorPayloadSchema>['error'] }[];
};

/**
 * What an --all-tenants query returns: one entry per tenant that answered, one error per
 * tenant that failed. A failing tenant never hides the others' results.
 */
class TenantResultsContract {
  static of<T extends z.ZodTypeAny>(data: T) {
    return z.object({
      results: z.array(z.object({ tenant: z.string(), data })),
      errors: z.array(z.object({ tenant: z.string(), error: ErrorPayloadSchema.shape.error })),
    });
  }
}

export { TenantResultsContract };
export type { TenantResults };
