import { z } from 'zod';
import type {
  GetRelationshipsAnchorsRequest,
  GetRelationshipsSummaryRequest,
} from '#shared/contracts/Relationships.js';

const SharedIdQuerySchema = z.object({
  sharedId: z.string().min(1),
}) satisfies z.ZodType<GetRelationshipsSummaryRequest>;

const AnchorsQuerySchema = SharedIdQuerySchema.extend({
  file: z.string().min(1),
}) satisfies z.ZodType<GetRelationshipsAnchorsRequest>;

export { SharedIdQuerySchema, AnchorsQuerySchema };
